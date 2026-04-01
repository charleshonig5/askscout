"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ModeToggle } from "@/components/ModeToggle";
import { DigestView } from "@/components/DigestView";
import { useStreamingText } from "@/lib/use-streaming-text";
import {
  MOCK_DIGEST,
  MOCK_HISTORY,
  MOCK_REPOS,
  MOCK_RESUME,
  MOCK_STANDUP,
  MOCK_STREAMING_TEXT,
} from "@/lib/mock-data";

type Mode = "digest" | "resume" | "standup";

export default function DashboardPage() {
  const [selectedRepo, setSelectedRepo] = useState(MOCK_REPOS[0]!);
  const [mode, setMode] = useState<Mode>("digest");
  const [activeHistoryId, setActiveHistoryId] = useState<string>("today");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const stream = useStreamingText(MOCK_STREAMING_TEXT);

  const activeEntry = MOCK_HISTORY.find((e) => e.id === activeHistoryId);
  const activeDate = activeEntry?.date ?? "Today";
  const isToday = activeDate === "Today";

  const modeLabels: Record<Mode, string> = {
    digest: "Digest",
    resume: "Resume Prompt",
    standup: "Standup",
  };
  const pageTitle = isToday ? `Today\u2019s ${modeLabels[mode]}` : `${modeLabels[mode]}`;

  return (
    <div>
      <Header
        repos={MOCK_REPOS}
        selectedRepo={selectedRepo}
        onRepoChange={setSelectedRepo}
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
              <h1 className="digest-page-name">{pageTitle}</h1>
              {!isToday && <span className="digest-page-date">{activeDate}</span>}
            </div>
            <div className="digest-header">
              <ModeToggle mode={mode} onChange={setMode} />
            </div>

            <DigestView
              mode={mode}
              digest={MOCK_DIGEST}
              resume={MOCK_RESUME}
              standup={MOCK_STANDUP}
              repoName={selectedRepo}
              timeLabel="today"
              isStreaming={stream.isStreaming}
              streamingText={stream.displayText}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
