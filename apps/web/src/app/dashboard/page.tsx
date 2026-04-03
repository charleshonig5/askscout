"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ModeToggle } from "@/components/ModeToggle";
import { DigestView } from "@/components/DigestView";
import { useDigestStream } from "@/lib/use-digest-stream";
import type { HistoryEntry } from "@/lib/mock-data";

type Mode = "digest" | "resume" | "standup";

const API_MODES: Record<Mode, string> = {
  digest: "digest",
  standup: "standup",
  resume: "resume",
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
  const resumeStream = useDigestStream();

  const streams: Record<Mode, ReturnType<typeof useDigestStream>> = {
    digest: digestStream,
    standup: standupStream,
    resume: resumeStream,
  };

  const currentStream = streams[mode];
  const lastRepoRef = useRef("");
  const [cachedDigests, setCachedDigests] = useState<Record<string, string>>({});

  // Fetch repos on mount
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/repos");
        if (res.ok) {
          const data = (await res.json()) as { repos: string[] };
          setRepos(data.repos);
          if (data.repos.length > 0 && !selectedRepo) {
            setSelectedRepo(data.repos[0]!);
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

  // Check for existing digest, generate only if none exists today
  const loadOrGenerate = useCallback(
    async (repoFullName: string, targetMode: Mode) => {
      // Check if we already have today's digest cached client-side
      const cacheKey = `${repoFullName}:${targetMode}`;
      if (cachedDigests[cacheKey]) return;

      // Check Supabase for today's digest
      try {
        const res = await fetch(
          `/api/digest/today?repo=${encodeURIComponent(repoFullName)}&mode=${targetMode}`,
        );
        if (res.ok) {
          const data = (await res.json()) as {
            exists: boolean;
            digest?: { content: string; stats: Record<string, unknown> | null };
          };
          if (data.exists && data.digest) {
            setCachedDigests((prev) => ({ ...prev, [cacheKey]: data.digest!.content }));
            return;
          }
        }
      } catch {
        // If check fails, just generate fresh
      }

      // No existing digest, generate a new one
      const parts = repoFullName.split("/");
      if (parts.length !== 2) return;
      const [owner, repo] = parts as [string, string];
      const stream = streams[targetMode];
      stream.reset();
      setTimeout(() => stream.start(owner, repo, API_MODES[targetMode]), 50);
    },
    [streams, cachedDigests],
  );

  // Force generate (bypasses cache)
  const forceGenerate = useCallback(
    (repoFullName: string, targetMode: Mode) => {
      const parts = repoFullName.split("/");
      if (parts.length !== 2) return;
      const [owner, repo] = parts as [string, string];
      const cacheKey = `${repoFullName}:${targetMode}`;
      setCachedDigests((prev) => {
        const next = { ...prev };
        delete next[cacheKey];
        return next;
      });
      const stream = streams[targetMode];
      stream.reset();
      setTimeout(() => stream.start(owner, repo, API_MODES[targetMode]), 50);
    },
    [streams],
  );

  // Load or generate digest when repo changes
  useEffect(() => {
    if (selectedRepo && selectedRepo !== lastRepoRef.current) {
      lastRepoRef.current = selectedRepo;
      digestStream.reset();
      standupStream.reset();
      resumeStream.reset();
      setCachedDigests({});
      void fetchHistory(selectedRepo);
      void loadOrGenerate(selectedRepo, "digest");
    }
  }, [selectedRepo]);

  // Cache completed streams and refresh history
  useEffect(() => {
    if (digestStream.isDone && digestStream.text && selectedRepo) {
      setCachedDigests((prev) => ({
        ...prev,
        [`${selectedRepo}:digest`]: digestStream.text,
      }));
      void fetchHistory(selectedRepo);
    }
  }, [digestStream.isDone]);

  useEffect(() => {
    if (standupStream.isDone && standupStream.text && selectedRepo) {
      setCachedDigests((prev) => ({
        ...prev,
        [`${selectedRepo}:standup`]: standupStream.text,
      }));
    }
  }, [standupStream.isDone]);

  useEffect(() => {
    if (resumeStream.isDone && resumeStream.text && selectedRepo) {
      setCachedDigests((prev) => ({
        ...prev,
        [`${selectedRepo}:resume`]: resumeStream.text,
      }));
    }
  }, [resumeStream.isDone]);

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

  // Click history entry to view old digest
  const handleHistorySelect = useCallback(
    (id: string) => {
      setActiveHistoryId(id);
      const record = historyRecords.find((h) => h.id === id);
      if (record) {
        digestStream.reset();
        // Show the historical content by setting it directly
        // For now just regenerate (history viewing comes later)
      }
    },
    [historyRecords, digestStream],
  );

  const repoName = selectedRepo.split("/").pop() ?? selectedRepo;

  const fullDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const modeLabels: Record<Mode, string> = {
    digest: "Digest",
    standup: "Standup",
    resume: "AI Context",
  };
  const modeSubtitles: Record<Mode, string> = {
    digest: repoName,
    standup: `Copy-paste standup for ${repoName}`,
    resume: `Paste into your AI coding tools to pick up where you left off on ${repoName}`,
  };
  const pageTitle = `Today\u2019s ${modeLabels[mode]}`;

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
              <p className="digest-page-date">{fullDate}</p>
              <p className="digest-page-subtitle">{modeSubtitles[mode]}</p>
            </div>
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
                streamingText={currentStream.text || cachedDigests[`${selectedRepo}:${mode}`] || ""}
                stats={digestStream.stats}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
