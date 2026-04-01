"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { ModeToggle } from "@/components/ModeToggle";
import { DigestView } from "@/components/DigestView";
import { HistoryList } from "@/components/HistoryList";
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
  const stream = useStreamingText(MOCK_STREAMING_TEXT);

  return (
    <div>
      <Header repos={MOCK_REPOS} selectedRepo={selectedRepo} onRepoChange={setSelectedRepo} />

      <div className="digest-container">
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

        <HistoryList
          entries={MOCK_HISTORY}
          activeId={activeHistoryId}
          onSelect={setActiveHistoryId}
        />
      </div>
    </div>
  );
}
