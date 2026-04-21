"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { DigestView, type DigestViewStats } from "@/components/DigestView";
import { AIContextModal } from "@/components/AIContextModal";
import { StandupModal } from "@/components/StandupModal";
import { PlanModal } from "@/components/PlanModal";
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
  // Check-in dates (YYYY-MM-DD) recorded for quiet-day visits — used by the
  // streak computation so rest days don't break a consecutive-day streak.
  const [checkinDates, setCheckinDates] = useState<string[]>([]);

  const digestStream = useDigestStream();
  const [aiContextOpen, setAiContextOpen] = useState(false);
  const [standupOpen, setStandupOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const lastRepoRef = useRef("");
  const [cachedDigests, setCachedDigests] = useState<
    Record<string, { content: string; stats: DigestViewStats | null }>
  >({});
  const cachedDigestsRef = useRef(cachedDigests);
  cachedDigestsRef.current = cachedDigests;
  // Track which repos have already completed their reveal animation in this
  // session so switching away and back doesn't replay the typing/cascade.
  const revealedReposRef = useRef<Set<string>>(new Set());
  const [, forceUpdate] = useState({});
  const [isCheckingCache, setIsCheckingCache] = useState(false);
  const [noNewCommits, setNoNewCommits] = useState<{
    content: string;
    stats: Record<string, unknown> | null;
    date: string;
  } | null>(null);
  // When true, expand from the Quiet Day state to show yesterday's actual digest
  const [showLatestFromQuietDay, setShowLatestFromQuietDay] = useState(false);
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
        const data = (await res.json()) as {
          history: HistoryRecord[];
          checkinDates?: string[];
        };
        setHistoryRecords(data.history);
        setCheckinDates(data.checkinDates ?? []);
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
        setCachedDigests((prev) => ({
          ...prev,
          [cacheKey]: {
            content: cached.content,
            stats: cached.stats as DigestViewStats | null,
          },
        }));
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
      setShowLatestFromQuietDay(false);
      // Clear history so the no-commits effect can't use the previous repo's data
      setHistoryRecords([]);
      setCheckinDates([]);
      setHistory([]);
      void fetchHistory(selectedRepo);
      void loadOrGenerate(selectedRepo, "digest");
    }
  }, [selectedRepo]);

  // When a new stream begins, treat this digest as fresh: remove it from the
  // revealed set so the animation plays from the start. This handles both
  // first-time generation and "Try again" regeneration of a previously
  // revealed repo.
  useEffect(() => {
    if (digestStream.isStreaming && selectedRepo) {
      if (revealedReposRef.current.has(selectedRepo)) {
        revealedReposRef.current.delete(selectedRepo);
        forceUpdate({});
      }
    }
  }, [digestStream.isStreaming, selectedRepo]);

  // Cache completed streams and refresh history
  useEffect(() => {
    if (digestStream.isDone && digestStream.text && selectedRepo) {
      setCachedDigests((prev) => ({
        ...prev,
        [`${selectedRepo}:digest`]: {
          content: digestStream.text,
          stats: digestStream.stats as DigestViewStats | null,
        },
      }));
      // Delay history refresh: the drip finalizes (isDone) when it hits the
      // 🔑 marker, but the SSE stream is still running (AI Context + Summary
      // sections). onComplete saves the digest to Supabase only when the full
      // stream ends. A short delay ensures the save completes before we query.
      const historyTimer = setTimeout(() => void fetchHistory(selectedRepo), 3000);
      // Mark this repo's reveal animation as complete after the full
      // cascade has played (~3 seconds covers all staggered reveals).
      const repo = selectedRepo;
      const revealTimer = setTimeout(() => {
        revealedReposRef.current.add(repo);
        forceUpdate({});
      }, 3000);
      return () => {
        clearTimeout(historyTimer);
        clearTimeout(revealTimer);
      };
    }
  }, [digestStream.isDone]);

  // Handle "no commits" error by showing most recent digest.
  // Matches both "No commits found..." (first-run) and "No new commits..." (returning user).
  useEffect(() => {
    if (!digestStream.error || !/no (new )?commits/i.test(digestStream.error)) {
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
          const data = (await res.json()) as {
            history: HistoryRecord[];
            checkinDates?: string[];
          };
          records = data.history;
          setHistoryRecords(data.history);
          setCheckinDates(data.checkinDates ?? []);
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

  // Record a daily check-in when the user lands on the quiet-day empty state.
  // Keeps their streak alive on rest days. Best-effort — silent on failure,
  // and optimistically adds today to the local checkinDates so the streak
  // number updates in the UI without waiting on a round trip.
  useEffect(() => {
    if (!noNewCommits || !selectedRepo) return;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const today = `${yyyy}-${mm}-${dd}`;

    // Optimistic local update so the streak pill updates instantly.
    setCheckinDates((prev) => (prev.includes(today) ? prev : [...prev, today]));

    // Fire the POST with a single silent retry after 2s. The retry catches
    // transient network blips (WiFi drop, Supabase cold-start). Persistent
    // failures (missing table, auth expired) will fail twice — that's fine,
    // those are admin-side issues visible in server logs.
    const body = JSON.stringify({ repo: selectedRepo, date: today });
    const attempt = () =>
      fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      }).then((res) => {
        if (!res.ok) throw new Error(`checkin failed: ${res.status}`);
        return res;
      });

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    attempt().catch(() => {
      if (cancelled) return;
      retryTimer = setTimeout(() => {
        if (cancelled) return;
        attempt().catch(() => {
          // Both attempts failed; server-side log captured it, user sees
          // preserved streak via the optimistic update until reload.
        });
      }, 2000);
    });

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [noNewCommits, selectedRepo]);

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

  // The sidebar's selected state falls back to today's history entry when we're
  // on the live view. Without this, nothing was selected on today's digest even
  // though it existed in the history list. Order of precedence:
  //   1. Explicitly viewing a past digest → that one
  //   2. Quiet-day + showing last digest → the last entry we're previewing
  //   3. Live view of today → today's entry (if it's been saved to history)
  //   4. Otherwise → nothing selected
  const sidebarActiveId = (() => {
    if (activeHistoryId) return activeHistoryId;
    if (noNewCommits && showLatestFromQuietDay && historyRecords.length > 0) {
      return historyRecords[0]!.id;
    }
    if (noNewCommits) return null;
    const todayKey = new Date().toDateString();
    const todayEntry = historyRecords.find(
      (h) => new Date(h.created_at).toDateString() === todayKey,
    );
    return todayEntry?.id ?? null;
  })();

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  let displayDate = todayStr;
  let pageTitle = "Today\u2019s Digest";

  if (noNewCommits && showLatestFromQuietDay) {
    displayDate = noNewCommits.date;
    pageTitle = "Your Last Digest";
  } else if (noNewCommits) {
    // Quiet Day state — keep today's date and a clear title
    pageTitle = "Quiet Day";
  } else if (isViewingHistory && activeHistoryEntry) {
    displayDate = new Date(activeHistoryEntry.created_at).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    pageTitle = "Digest";
  }

  // Compute per-repo streak AND personal best from history records + check-ins.
  // A day counts as "active" if a digest was generated OR a check-in recorded.
  // Personal best is the longest consecutive-days run found anywhere in the
  // active set (always >= current streak, since current is part of that set).
  const { streak, personalBest } = (() => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmtKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const activeDays = new Set<string>();
    for (const h of historyRecords) {
      activeDays.add(fmtKey(new Date(h.created_at)));
    }
    for (const date of checkinDates) {
      // checkinDates arrive as YYYY-MM-DD already; they match fmtKey's shape.
      activeDays.add(date);
    }
    if (activeDays.size === 0) return { streak: 0, personalBest: 0 };

    // Current streak: count back from today, skipping today if it has no entry.
    let current = 0;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = fmtKey(d);
      if (activeDays.has(key)) {
        current++;
      } else if (i === 0) {
        continue;
      } else {
        break;
      }
    }

    // Personal best: iterate sorted active days, track longest consecutive run.
    // Sort lexically — YYYY-MM-DD is naturally date-ordered. DST-safe via
    // Math.round on the day diff (23h → 1, 25h → 1).
    const sortedDays = [...activeDays].sort();
    const DAY_MS = 24 * 60 * 60 * 1000;
    let longest = 1;
    let run = 1;
    for (let i = 1; i < sortedDays.length; i++) {
      const prev = new Date(sortedDays[i - 1] + "T00:00:00");
      const curr = new Date(sortedDays[i] + "T00:00:00");
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / DAY_MS);
      if (diffDays === 1) {
        run++;
        if (run > longest) longest = run;
      } else {
        run = 1;
      }
    }

    // Best should never be less than current (current is part of activeDays
    // and contiguous by definition). Clamp defensively in case of any drift.
    return { streak: current, personalBest: Math.max(longest, current) };
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
          activeId={sidebarActiveId}
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
                    <span className="streak-tooltip" role="tooltip">
                      <span className="streak-tooltip-label">Best</span>
                      <span className="streak-tooltip-value">
                        {personalBest} {personalBest === 1 ? "day" : "days"}
                      </span>
                    </span>
                  </span>
                )}
              </h1>
              <p className="digest-page-date">{displayDate}</p>
              <p className="digest-page-subtitle">{repoName}</p>
            </div>

            {noNewCommits && !showLatestFromQuietDay ? (
              <div className="quiet-day">
                <div className="quiet-day-emoji">{"\u2615"}</div>
                <h2 className="quiet-day-title">No new commits today</h2>
                <p className="quiet-day-subtitle">
                  {repoName} hasn&apos;t seen activity since your digest on {noNewCommits.date}.
                  Rest counts too — Scout will be here when you&apos;re back.
                </p>
                {streak >= 2 && (
                  <div className="quiet-day-streak">
                    {"\ud83d\udd25"} {streak}-day streak kept alive
                  </div>
                )}
                <div className="quiet-day-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowLatestFromQuietDay(true)}
                  >
                    View your last digest
                  </button>
                </div>
              </div>
            ) : noNewCommits && showLatestFromQuietDay ? (
              <>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowLatestFromQuietDay(false)}
                  style={{ marginBottom: "var(--space-lg)" }}
                >
                  ← Back to today
                </button>
                <DigestView
                  isStreaming={false}
                  streamingText={currentSections?.digest ?? noNewCommits.content}
                  stats={noNewCommits.stats as DigestViewStats | null}
                  repoName={repoName}
                  visibleSections={digestSectionPrefs ?? undefined}
                  onResumeWithAI={() => setAiContextOpen(true)}
                  onGenerateStandup={() => setStandupOpen(true)}
                  onGeneratePlan={() => setPlanOpen(true)}
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
                  stats={viewingHistoryStats as DigestViewStats | null}
                  repoName={repoName}
                  visibleSections={digestSectionPrefs ?? undefined}
                  onResumeWithAI={() => setAiContextOpen(true)}
                  onGenerateStandup={() => setStandupOpen(true)}
                  onGeneratePlan={() => setPlanOpen(true)}
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
                      {/no (new )?commits/i.test(digestStream.error) && (
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
                    animate={
                      digestStream.isStreaming ||
                      (digestStream.isDone && !revealedReposRef.current.has(selectedRepo))
                    }
                    streamingText={currentSections?.digest ?? ""}
                    stats={
                      (digestStream.stats ||
                        cachedDigests[`${selectedRepo}:digest`]?.stats ||
                        null) as DigestViewStats | null
                    }
                    onResumeWithAI={() => setAiContextOpen(true)}
                    onGenerateStandup={() => setStandupOpen(true)}
                    onGeneratePlan={() => setPlanOpen(true)}
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

      <PlanModal
        isOpen={planOpen}
        onClose={() => setPlanOpen(false)}
        content={currentSections?.plan || null}
      />
    </div>
  );
}
