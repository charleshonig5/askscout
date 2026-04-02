"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ModeToggle } from "@/components/ModeToggle";
import { DigestView } from "@/components/DigestView";
import { useDigestStream } from "@/lib/use-digest-stream";
import type { HistoryEntry } from "@/lib/mock-data";

type Mode = "digest" | "resume" | "standup";

// Maps our UI mode names to API mode params
const API_MODES: Record<Mode, string> = {
  digest: "digest",
  standup: "standup",
  resume: "resume",
};

export default function DashboardPage() {
  const [repos, setRepos] = useState<string[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [mode, setMode] = useState<Mode>("digest");
  const [activeHistoryId, setActiveHistoryId] = useState<string>("today");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Separate streams for each mode
  const digestStream = useDigestStream();
  const standupStream = useDigestStream();
  const resumeStream = useDigestStream();

  const streams: Record<Mode, ReturnType<typeof useDigestStream>> = {
    digest: digestStream,
    standup: standupStream,
    resume: resumeStream,
  };

  const currentStream = streams[mode];
  const history: HistoryEntry[] = [];
  const lastRepoRef = useRef("");

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

  // Generate for a specific mode
  const generate = useCallback(
    (repoFullName: string, targetMode: Mode) => {
      const parts = repoFullName.split("/");
      if (parts.length !== 2) return;
      const [owner, repo] = parts as [string, string];
      const stream = streams[targetMode];
      stream.reset();
      setTimeout(() => stream.start(owner, repo, API_MODES[targetMode]), 50);
    },
    [streams],
  );

  // Auto-generate digest when first repo loads
  useEffect(() => {
    if (selectedRepo && selectedRepo !== lastRepoRef.current) {
      lastRepoRef.current = selectedRepo;
      // Reset all streams when repo changes
      digestStream.reset();
      standupStream.reset();
      resumeStream.reset();
      // Auto-generate digest for new repo
      setTimeout(() => {
        const parts = selectedRepo.split("/");
        if (parts.length === 2) {
          const [owner, repo] = parts as [string, string];
          digestStream.start(owner, repo, "digest");
        }
      }, 50);
    }
  }, [selectedRepo]);  

  // When tab changes, generate if that mode hasn't been generated yet
  const handleModeChange = useCallback(
    (newMode: Mode) => {
      setMode(newMode);
      const stream = streams[newMode];
      if (!stream.text && !stream.isStreaming && !stream.isDone && !stream.error && selectedRepo) {
        generate(selectedRepo, newMode);
      }
    },
    [streams, selectedRepo, generate],
  );

  const handleRepoChange = useCallback((repo: string) => {
    setSelectedRepo(repo);
  }, []);

  const repoName = selectedRepo.split("/").pop() ?? selectedRepo;
  const activeEntry = history.find((e) => e.id === activeHistoryId);
  const activeDate = activeEntry?.date ?? "Today";
  const isToday = activeDate === "Today";

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
  const pageTitle = isToday ? `Today\u2019s ${modeLabels[mode]}` : `${modeLabels[mode]}`;

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
          onSelect={setActiveHistoryId}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="app-main">
          <div className="digest-container">
            <div className="digest-page-title">
              <div className="digest-page-title-row">
                <h1 className="digest-page-name">{pageTitle}</h1>
                {!isToday && <span className="digest-page-date">{activeDate}</span>}
              </div>
              <p className="digest-page-subtitle">{modeSubtitles[mode]}</p>
            </div>
            <div className="digest-header">
              <ModeToggle mode={mode} onChange={handleModeChange} />
            </div>

            {currentStream.error ? (
              <div className="digest-error">
                <p>{currentStream.error}</p>
                <button className="btn btn-secondary" onClick={() => generate(selectedRepo, mode)}>
                  Try again
                </button>
              </div>
            ) : (
              <DigestView
                mode={mode}
                digest={null}
                resume={resumeStream.text}
                standup={{ yesterday: [], today: [], blockers: [] }}
                repoName={selectedRepo}
                timeLabel="past 7 days"
                isStreaming={currentStream.isStreaming}
                streamingText={currentStream.text}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
