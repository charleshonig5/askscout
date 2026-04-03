"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ModeToggle } from "@/components/ModeToggle";
import { DigestView } from "@/components/DigestView";
import { AIContextModal } from "@/components/AIContextModal";
import { useDigestStream } from "@/lib/use-digest-stream";
import type { HistoryEntry } from "@/lib/mock-data";

type Mode = "digest" | "standup";

const API_MODES: Record<Mode, string> = {
  digest: "digest",
  standup: "standup",
};

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
  const [mode, setMode] = useState<Mode>("digest");
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);

  const digestStream = useDigestStream();
  const standupStream = useDigestStream();
  const [aiContextOpen, setAiContextOpen] = useState(false);

  const streams: Record<Mode, ReturnType<typeof useDigestStream>> = {
    digest: digestStream,
    standup: standupStream,
  };

  const currentStream = streams[mode];
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
      targetMode: Mode,
    ): Promise<{ content: string; stats: Record<string, unknown> | null } | null> => {
      try {
        const res = await fetch(
          `/api/digest/today?repo=${encodeURIComponent(repoFullName)}&mode=${targetMode}`,
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
    async (repoFullName: string, targetMode: Mode) => {
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
      streams[targetMode].start(owner, repo, API_MODES[targetMode]);
    },
    [checkTodaysDigest, streams],
  );

  // Force generate (bypasses cache)
  const forceGenerate = useCallback(
    (repoFullName: string, targetMode: Mode) => {
      const parts = repoFullName.split("/");
      if (parts.length !== 2) return;
      const cacheKey = `${repoFullName}:${targetMode}`;
      setCachedDigests((prev) => {
        const next = { ...prev };
        delete next[cacheKey];
        return next;
      });
      const [owner, repo] = parts as [string, string];
      streams[targetMode].start(owner, repo, API_MODES[targetMode]);
    },
    [streams],
  );

  // When repo changes: reset everything and load digest
  useEffect(() => {
    if (selectedRepo && selectedRepo !== lastRepoRef.current) {
      lastRepoRef.current = selectedRepo;
      // Abort all in-flight streams
      digestStream.reset();
      standupStream.reset();
      setCachedDigests({});
      setMode("digest");
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

  useEffect(() => {
    if (standupStream.isDone && standupStream.text && selectedRepo) {
      setCachedDigests((prev) => ({
        ...prev,
        [`${selectedRepo}:standup`]: { content: standupStream.text, stats: null },
      }));
    }
  }, [standupStream.isDone]);

  const handleModeChange = useCallback(
    (newMode: Mode) => {
      setMode(newMode);
      const cacheKey = `${selectedRepo}:${newMode}`;
      const stream = streams[newMode];
      if (
        !cachedDigests[cacheKey] &&
        !stream.text &&
        !stream.isStreaming &&
        !stream.isDone &&
        !stream.error &&
        selectedRepo
      ) {
        void loadOrGenerate(selectedRepo, newMode);
      }
    },
    [streams, selectedRepo, cachedDigests, loadOrGenerate],
  );

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
        setMode("digest");
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

  const modeLabels: Record<Mode, string> = {
    digest: "Digest",
    standup: "Standup",
  };
  const modeSubtitles: Record<Mode, string> = {
    digest: repoName,
    standup: `Copy-paste standup for ${repoName}`,
  };

  // Parse owner/repo for the AI context modal
  const repoParts = selectedRepo.split("/");
  const repoOwner = repoParts[0] ?? "";
  const repoShortName = repoParts[1] ?? "";
  const pageTitle = isViewingHistory ? modeLabels[mode] : `Today\u2019s ${modeLabels[mode]}`;

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
              <p className="digest-page-subtitle">{modeSubtitles[mode]}</p>
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
                  mode="digest"
                  isStreaming={false}
                  streamingText={viewingHistoryContent}
                  stats={viewingHistoryStats}
                />
              </>
            ) : (
              <>
                <div className="digest-header">
                  <ModeToggle mode={mode} onChange={handleModeChange} />
                </div>

                {currentStream.error ? (
                  <div className="digest-error">
                    <p>{currentStream.error}</p>
                    <button
                      className="btn btn-secondary"
                      onClick={() => forceGenerate(selectedRepo, mode)}
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  <DigestView
                    mode={mode}
                    isStreaming={currentStream.isStreaming}
                    isLoading={isCheckingCache}
                    streamingText={
                      currentStream.text || cachedDigests[`${selectedRepo}:${mode}`]?.content || ""
                    }
                    stats={
                      (digestStream.stats ||
                        cachedDigests[`${selectedRepo}:${mode}`]?.stats ||
                        null) as Record<string, unknown> | null
                    }
                    onResumeWithAI={() => setAiContextOpen(true)}
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
        owner={repoOwner}
        repo={repoShortName}
      />
    </div>
  );
}
