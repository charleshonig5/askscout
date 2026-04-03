"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { DigestView } from "@/components/DigestView";
import { AIContextModal } from "@/components/AIContextModal";
import { StandupModal } from "@/components/StandupModal";
import { useDigestStream } from "@/lib/use-digest-stream";
import type { HistoryEntry } from "@/lib/mock-data";

interface HistoryRecord {
  id: string;
  content: string;
  stats: Record<string, unknown> | null;
  created_at: string;
}

function formatHistoryDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.round((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DashboardPage() {
  const [repos, setRepos] = useState<string[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);

  const digestStream = useDigestStream();
  const [aiContextOpen, setAiContextOpen] = useState(false);
  const [standupOpen, setStandupOpen] = useState(false);
  const lastRepoRef = useRef("");
  const [cachedDigests, setCachedDigests] = useState<
    Record<string, { content: string; stats: Record<string, unknown> | null }>
  >({});
  const [isCheckingCache, setIsCheckingCache] = useState(false);

  // Fetch repos and user settings on mount
  useEffect(() => {
    void (async () => {
      try {
        const [reposRes, settingsRes] = await Promise.all([
          fetch("/api/repos"),
          fetch("/api/settings"),
        ]);

        let defaultRepoSetting: string | null = null;
        if (settingsRes.ok) {
          const settings = (await settingsRes.json()) as { default_repo: string | null };
          defaultRepoSetting = settings.default_repo;
        }

        if (reposRes.ok) {
          const data = (await reposRes.json()) as { repos: string[] };
          setRepos(data.repos);
          if (data.repos.length > 0 && !selectedRepo) {
            // Use saved default repo if it exists and is in the list
            const preferred =
              defaultRepoSetting && data.repos.includes(defaultRepoSetting)
                ? defaultRepoSetting
                : data.repos[0]!;
            setSelectedRepo(preferred);
          }
        }
      } catch {
        // Silently fail
      }
    })();
  }, []);

  // Fetch history when repo changes
  const fetchHistory = useCallback(async (repo: string) => {
    try {
      const res = await fetch(`/api/history?repo=${encodeURIComponent(repo)}`);
      if (res.ok) {
        const data = (await res.json()) as { history: HistoryRecord[] };
        setHistoryRecords(data.history);
        setHistory(
          data.history.map((h) => ({
            id: h.id,
            date: formatHistoryDate(h.created_at),
            vibeCheck: h.content.slice(0, 100),
            commits: (h.stats as Record<string, number> | null)?.commits ?? 0,
            filesChanged: (h.stats as Record<string, number> | null)?.filesChanged ?? 0,
            shippedCount: 0,
            changedCount: 0,
            unstableCount: 0,
          })),
        );
      }
    } catch {
      // History fetch failed silently
    }
  }, []);

  // Check Supabase for today's digest, return content or null
  const checkTodaysDigest = useCallback(
    async (
      repoFullName: string,
      targetMode: string,
    ): Promise<{ content: string; stats: Record<string, unknown> | null } | null> => {
      try {
        const res = await fetch(
          `/api/digest/today?repo=${encodeURIComponent(repoFullName)}&mode=${targetMode}&tz=${new Date().getTimezoneOffset()}`,
          { signal: AbortSignal.timeout(5000) },
        );
        if (res.ok) {
          const data = (await res.json()) as {
            exists: boolean;
            digest?: { content: string; stats: Record<string, unknown> | null };
          };
          if (data.exists && data.digest) {
            return { content: data.digest.content, stats: data.digest.stats };
          }
        }
      } catch {
        // Timeout or network error, fall through to generate
      }
      return null;
    },
    [],
  );

  // Load cached or generate fresh for a repo+mode
  const loadOrGenerate = useCallback(
    async (repoFullName: string, targetMode: string) => {
      setIsCheckingCache(true);

      const cached = await checkTodaysDigest(repoFullName, targetMode);

      // Discard result if repo changed while we were checking
      if (lastRepoRef.current !== repoFullName) {
        setIsCheckingCache(false);
        return;
      }

      if (cached) {
        const cacheKey = `${repoFullName}:${targetMode}`;
        setCachedDigests((prev) => ({ ...prev, [cacheKey]: cached }));
        setIsCheckingCache(false);
        return;
      }

      setIsCheckingCache(false);

      // Double-check repo hasn't changed before generating
      if (lastRepoRef.current !== repoFullName) return;

      // Generate fresh
      const parts = repoFullName.split("/");
      if (parts.length !== 2) return;
      const [owner, repo] = parts as [string, string];
      digestStream.start(owner, repo, targetMode);
    },
    [checkTodaysDigest, digestStream],
  );

  // Force generate (bypasses cache)
  const forceGenerate = useCallback(
    (repoFullName: string, targetMode: string) => {
      const parts = repoFullName.split("/");
      if (parts.length !== 2) return;
      const cacheKey = `${repoFullName}:${targetMode}`;
      setCachedDigests((prev) => {
        const next = { ...prev };
        delete next[cacheKey];
        return next;
      });
      const [owner, repo] = parts as [string, string];
      digestStream.start(owner, repo, targetMode);
    },
    [digestStream],
  );

  // When repo changes: reset everything and load digest
  useEffect(() => {
    if (selectedRepo && selectedRepo !== lastRepoRef.current) {
      lastRepoRef.current = selectedRepo;
      // Abort all in-flight streams
      digestStream.reset();
      setCachedDigests({});

      setViewingHistoryContent(null);
      setActiveHistoryId(null);
      void fetchHistory(selectedRepo);
      void loadOrGenerate(selectedRepo, "digest");
    }
  }, [selectedRepo]);

  // Cache completed streams and refresh history
  useEffect(() => {
    if (digestStream.isDone && digestStream.text && selectedRepo) {
      setCachedDigests((prev) => ({
        ...prev,
        [`${selectedRepo}:digest`]: {
          content: digestStream.text,
          stats: digestStream.stats as Record<string, unknown> | null,
        },
      }));
      void fetchHistory(selectedRepo);
    }
  }, [digestStream.isDone]);

  const handleRepoChange = useCallback((repo: string) => {
    setSelectedRepo(repo);
  }, []);

  // State for viewing historical digests
  const [viewingHistoryContent, setViewingHistoryContent] = useState<string | null>(null);
  const [viewingHistoryStats, setViewingHistoryStats] = useState<Record<string, unknown> | null>(
    null,
  );

  // Click history entry to view that digest
  const handleHistorySelect = useCallback(
    (id: string) => {
      setActiveHistoryId(id);
      const record = historyRecords.find((h) => h.id === id);
      if (record) {
        setViewingHistoryContent(record.content);
        setViewingHistoryStats(record.stats);
      }
    },
    [historyRecords],
  );

  // "Back to today" — clear historical view
  const handleBackToToday = useCallback(() => {
    setActiveHistoryId(null);
    setViewingHistoryContent(null);
    setViewingHistoryStats(null);
  }, []);

  const isViewingHistory = viewingHistoryContent !== null;
  const repoName = selectedRepo.split("/").pop() ?? selectedRepo;

  // Find the active history entry for the title
  const activeHistoryEntry = historyRecords.find((h) => h.id === activeHistoryId);

  const displayDate =
    isViewingHistory && activeHistoryEntry
      ? new Date(activeHistoryEntry.created_at).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });

  const pageTitle = isViewingHistory ? "Digest" : "Today\u2019s Digest";

  return (
    <div>
      <Header
        repos={repos.length > 0 ? repos : [selectedRepo || "Loading..."]}
        selectedRepo={selectedRepo || "Loading..."}
        onRepoChange={handleRepoChange}
        onMenuToggle={() => setSidebarOpen((v) => !v)}
      />

      <div className="app-layout">
        <Sidebar
          entries={history}
          activeId={activeHistoryId}
          onSelect={handleHistorySelect}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="app-main">
          <div className="digest-container">
            <div className="digest-page-title">
              <h1 className="digest-page-name">{pageTitle}</h1>
              <p className="digest-page-date">{displayDate}</p>
              <p className="digest-page-subtitle">{repoName}</p>
            </div>

            {isViewingHistory ? (
              <>
                <button
                  className="btn btn-secondary"
                  onClick={handleBackToToday}
                  style={{ marginBottom: "var(--space-lg)" }}
                >
                  Back to today
                </button>
                <DigestView
                  isStreaming={false}
                  streamingText={viewingHistoryContent}
                  stats={viewingHistoryStats}
                  onResumeWithAI={() => setAiContextOpen(true)}
                  onGenerateStandup={() => setStandupOpen(true)}
                />
              </>
            ) : (
              <>
                {digestStream.error ? (
                  <div className="digest-error">
                    <p>{digestStream.error}</p>
                    <button
                      className="btn btn-secondary"
                      onClick={() => forceGenerate(selectedRepo, "digest")}
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  <DigestView
                    isStreaming={digestStream.isStreaming}
                    isLoading={isCheckingCache}
                    streamingText={(() => {
                      const raw =
                        digestStream.text || cachedDigests[`${selectedRepo}:digest`]?.content || "";
                      // Only show digest portion, strip standup/AI context
                      if (raw.includes("---DIGEST---")) {
                        return (
                          raw.split("---DIGEST---")[1]?.split("---STANDUP---")[0]?.trim() ?? raw
                        );
                      }
                      return raw.split("---STANDUP---")[0]?.trim() ?? raw;
                    })()}
                    stats={
                      (digestStream.stats ||
                        cachedDigests[`${selectedRepo}:digest`]?.stats ||
                        null) as Record<string, unknown> | null
                    }
                    onResumeWithAI={() => setAiContextOpen(true)}
                    onGenerateStandup={() => setStandupOpen(true)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <AIContextModal
        isOpen={aiContextOpen}
        onClose={() => setAiContextOpen(false)}
        content={digestStream.sections?.aiContext ?? null}
      />

      <StandupModal
        isOpen={standupOpen}
        onClose={() => setStandupOpen(false)}
        content={digestStream.sections?.standup ?? null}
      />
    </div>
  );
}
