"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ModeToggle } from "@/components/ModeToggle";
import { DigestView } from "@/components/DigestView";
import { useDigestStream } from "@/lib/use-digest-stream";
import { MOCK_HISTORY, MOCK_STANDUP } from "@/lib/mock-data";

type Mode = "digest" | "resume" | "standup";

export default function DashboardPage() {
  const [repos, setRepos] = useState<string[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [mode, setMode] = useState<Mode>("digest");
  const [activeHistoryId, setActiveHistoryId] = useState<string>("today");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const stream = useDigestStream();

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
        // Silently fail, repos will be empty
      }
    })();
  }, []);

  // Generate digest when repo changes
  const generateDigest = useCallback(
    (repoFullName: string) => {
      const parts = repoFullName.split("/");
      if (parts.length !== 2) return;
      const [owner, repo] = parts as [string, string];
      stream.start(owner, repo);
    },
    [stream],
  );

  const handleRepoChange = useCallback(
    (repo: string) => {
      setSelectedRepo(repo);
      generateDigest(repo);
    },
    [generateDigest],
  );

  // Auto-generate on first repo load
  useEffect(() => {
    if (selectedRepo && !stream.text && !stream.isStreaming && !stream.isDone) {
      generateDigest(selectedRepo);
    }
  }, [selectedRepo]);

  const repoName = selectedRepo.split("/").pop() ?? selectedRepo;
  const activeEntry = MOCK_HISTORY.find((e) => e.id === activeHistoryId);
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
          entries={MOCK_HISTORY}
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
              <ModeToggle mode={mode} onChange={setMode} />
            </div>

            {stream.error ? (
              <div className="digest-error">
                <p>{stream.error}</p>
                <button className="btn btn-secondary" onClick={() => generateDigest(selectedRepo)}>
                  Try again
                </button>
              </div>
            ) : (
              <DigestView
                mode={mode}
                digest={null}
                resume={stream.text}
                standup={MOCK_STANDUP}
                repoName={selectedRepo}
                timeLabel="past 7 days"
                isStreaming={stream.isStreaming}
                streamingText={stream.text}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
