"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { DigestView } from "@/components/DigestView";
import { AIContextModal } from "@/components/AIContextModal";
import { StandupModal } from "@/components/StandupModal";
import { useDigestStream } from "@/lib/use-digest-stream";
import { parseSections } from "@/lib/parse-sections";

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
  // Compare calendar dates, not hour differences
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const entryDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - entryDay.getTime()) / (1000 * 60 * 60 * 24));
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
  const cachedDigestsRef = useRef(cachedDigests);
  cachedDigestsRef.current = cachedDigests;
  const [isCheckingCache, setIsCheckingCache] = useState(false);
  const [noNewCommits, setNoNewCommits] = useState<{
    content: string;
    stats: Record<string, unknown> | null;
    date: string;
  } | null>(null);
  const [digestSectionPrefs, setDigestSectionPrefs] = useState<Record<string, boolean> | null>(
    null,
  );

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
          const settings = (await settingsRes.json()) as {
            default_repo: string | null;
            digest_sections: Record<string, boolean> | null;
          };
          defaultRepoSetting = settings.default_repo;
          if (settings.digest_sections) {
            setDigestSectionPrefs(settings.digest_sections);
          }
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
          data.history.map((h) => {
            // Count bullets in each section from the stored content
            const countBullets = (sectionEmoji: string, nextEmoji: string) => {
              const start = h.content.indexOf(sectionEmoji);
              if (start === -1) return 0;
              const end = nextEmoji ? h.content.indexOf(nextEmoji, start + 1) : h.content.length;
              const section = h.content.slice(start, end === -1 ? undefined : end);
              return (section.match(/\u2022/g) ?? []).length;
            };

            return {
              id: h.id,
              date: formatHistoryDate(h.created_at),
              vibeCheck: h.content.slice(0, 100),
              commits: (h.stats as Record<string, number> | null)?.commits ?? 0,
              filesChanged: (h.stats as Record<string, number> | null)?.filesChanged ?? 0,
              shippedCount: countBullets("\ud83d\ude80", "\ud83d\udd27"),
              changedCount: countBullets("\ud83d\udd27", "\ud83d\udd01"),
              unstableCount: countBullets("\ud83d\udd01", "\ud83d\udccd"),
            };
          }),
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
      // Check in-memory cache first (instant, no network)
      const cacheKey = `${repoFullName}:${targetMode}`;
      if (cachedDigestsRef.current[cacheKey]) {
        return;
      }

      setIsCheckingCache(true);

      const cached = await checkTodaysDigest(repoFullName, targetMode);

      // Discard result if repo changed while we were checking
      if (lastRepoRef.current !== repoFullName) {
        setIsCheckingCache(false);
        return;
      }

      if (cached) {
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

      setViewingHistoryContent(null);
      setViewingHistoryStats(null);
      setActiveHistoryId(null);
      setNoNewCommits(null);
      // Clear history so the no-commits effect can't use the previous repo's data
      setHistoryRecords([]);
      setHistory([]);
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

  // Handle "no commits" error by showing most recent digest
  useEffect(() => {
    if (!digestStream.error || !digestStream.error.toLowerCase().includes("no commits")) {
      return;
    }

    // If history is loaded, show the latest digest
    if (historyRecords.length > 0) {
      const latest = historyRecords[0]!;
      setNoNewCommits({
        content: latest.content,
        stats: latest.stats,
        date: new Date(latest.created_at).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
      });
      digestStream.reset();
      return;
    }

    // History not loaded yet — try to fetch it so the effect can re-run
    if (selectedRepo) {
      void fetchHistory(selectedRepo);
    }
  }, [digestStream.error, historyRecords, selectedRepo, fetchHistory]);

  // Manual fallback: show latest digest when auto-redirect fails
  const showLatestFromHistory = useCallback(async () => {
    let records = historyRecords;
    // If history is empty, fetch it on demand
    if (records.length === 0 && selectedRepo) {
      try {
        const res = await fetch(`/api/history?repo=${encodeURIComponent(selectedRepo)}`);
        if (res.ok) {
          const data = (await res.json()) as { history: HistoryRecord[] };
          records = data.history;
          setHistoryRecords(data.history);
        }
      } catch {
        return;
      }
    }
    if (records.length === 0) return;
    const latest = records[0]!;
    setNoNewCommits({
      content: latest.content,
      stats: latest.stats,
      date: new Date(latest.created_at).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    });
    digestStream.reset();
  }, [historyRecords, selectedRepo, digestStream]);

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
      const record = historyRecords.find((h) => h.id === id);
      if (!record) return;

      // If this entry is from today, go back to the live view
      const entryDate = new Date(record.created_at).toDateString();
      const today = new Date().toDateString();
      if (entryDate === today) {
        setActiveHistoryId(null);
        setViewingHistoryContent(null);
        setViewingHistoryStats(null);
        return;
      }

      setActiveHistoryId(id);
      setViewingHistoryContent(record.content);
      setViewingHistoryStats(record.stats);
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

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  let displayDate = todayStr;
  let pageTitle = "Today\u2019s Digest";

  if (noNewCommits) {
    displayDate = noNewCommits.date;
    pageTitle = "Your Digest";
  } else if (isViewingHistory && activeHistoryEntry) {
    displayDate = new Date(activeHistoryEntry.created_at).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    pageTitle = "Digest";
  }

  // Compute per-repo streak from history records (consecutive calendar days)
  const streak = (() => {
    if (historyRecords.length === 0) return 0;
    const digestDays = new Set(
      historyRecords.map((h) => {
        const d = new Date(h.created_at);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      }),
    );
    let count = 0;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (digestDays.has(key)) {
        count++;
      } else if (i === 0) {
        // Today might not have a digest yet, skip it
        continue;
      } else {
        break;
      }
    }
    return count;
  })();

  // Determine the raw content for the current view (unified text with section markers)
  const currentRawContent = noNewCommits
    ? noNewCommits.content
    : isViewingHistory
      ? (viewingHistoryContent ?? "")
      : digestStream.text || cachedDigests[`${selectedRepo}:digest`]?.content || "";

  // Parse sections from whatever content source is active
  const currentSections = currentRawContent ? parseSections(currentRawContent) : null;

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
              <h1 className="digest-page-name">
                {pageTitle}
                {!noNewCommits && !isViewingHistory && streak >= 2 && (
                  <span className="digest-streak">
                    {"\ud83d\udd25"} {streak}-day streak
                  </span>
                )}
              </h1>
              <p className="digest-page-date">{displayDate}</p>
              <p className="digest-page-subtitle">{repoName}</p>
            </div>

            {noNewCommits ? (
              <>
                <div className="digest-notice">No new commits since this digest.</div>
                <DigestView
                  isStreaming={false}
                  streamingText={currentSections?.digest ?? noNewCommits.content}
                  stats={noNewCommits.stats}
                  repoName={repoName}
                  visibleSections={digestSectionPrefs ?? undefined}
                  onResumeWithAI={() => setAiContextOpen(true)}
                  onGenerateStandup={() => setStandupOpen(true)}
                />
              </>
            ) : isViewingHistory ? (
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
                  streamingText={currentSections?.digest ?? viewingHistoryContent ?? ""}
                  stats={viewingHistoryStats}
                  repoName={repoName}
                  visibleSections={digestSectionPrefs ?? undefined}
                  onResumeWithAI={() => setAiContextOpen(true)}
                  onGenerateStandup={() => setStandupOpen(true)}
                />
              </>
            ) : (
              <>
                {digestStream.error ? (
                  <div className="digest-error">
                    <p>{digestStream.error}</p>
                    <div className="digest-error-actions">
                      <button
                        className="btn btn-secondary"
                        onClick={() => forceGenerate(selectedRepo, "digest")}
                      >
                        Try again
                      </button>
                      {digestStream.error.toLowerCase().includes("no commits") && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => void showLatestFromHistory()}
                        >
                          Show latest digest
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <DigestView
                    isStreaming={digestStream.isStreaming}
                    isLoading={isCheckingCache}
                    animate
                    streamingText={currentSections?.digest ?? ""}
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
        content={currentSections?.aiContext || null}
      />

      <StandupModal
        isOpen={standupOpen}
        onClose={() => setStandupOpen(false)}
        content={currentSections?.standup || null}
      />
    </div>
  );
}
