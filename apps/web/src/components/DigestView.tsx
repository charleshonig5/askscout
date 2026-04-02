"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import type { Digest } from "@askscout/core";

function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button className="copy-block-btn" onClick={handleCopy}>
      {copied ? (
        <>
          <Check size={16} /> Copied
        </>
      ) : (
        <>
          <Copy size={16} /> {label ?? "Copy to clipboard"}
        </>
      )}
    </button>
  );
}

// Section markers used in the digest streaming text
const SECTION_MARKERS = [
  { key: "vibe", emoji: "\ud83d\udcac", label: "Vibe Check" },
  { key: "shipped", emoji: "\ud83d\ude80", label: "Shipped" },
  { key: "changed", emoji: "\ud83d\udd27", label: "Changed" },
  { key: "unstable", emoji: "\u26a0\ufe0f", label: "Unstable" },
  { key: "leftOff", emoji: "\ud83d\udccd", label: "Left Off" },
  { key: "stats", emoji: "\ud83d\udcca", label: "Stats" },
] as const;

interface ParsedSection {
  key: string;
  emoji: string;
  label: string;
  content: string;
}

function parseStreamingSections(text: string): ParsedSection[] {
  const sections: ParsedSection[] = [];

  for (let i = 0; i < SECTION_MARKERS.length; i++) {
    const marker = SECTION_MARKERS[i]!;
    const searchStr = `${marker.emoji} ${marker.label}`;
    const startIdx = text.indexOf(searchStr);
    if (startIdx === -1) continue;

    const contentStart = startIdx + searchStr.length;

    let endIdx = text.length;
    for (let j = i + 1; j < SECTION_MARKERS.length; j++) {
      const nextMarker = SECTION_MARKERS[j]!;
      const nextSearch = `${nextMarker.emoji} ${nextMarker.label}`;
      const nextIdx = text.indexOf(nextSearch, contentStart);
      if (nextIdx !== -1) {
        endIdx = nextIdx;
        break;
      }
    }

    sections.push({
      key: marker.key,
      emoji: marker.emoji,
      label: marker.label,
      content: text.slice(contentStart, endIdx).trim(),
    });
  }

  return sections;
}

function StreamingDigest({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  const cursorRef = useRef<HTMLSpanElement>(null);
  const sections = parseStreamingSections(text);
  const isLastSection = (key: string) => {
    const last = sections[sections.length - 1];
    return last?.key === key;
  };

  useEffect(() => {
    if (isStreaming && cursorRef.current) {
      cursorRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [text, isStreaming]);

  const cursor = <span ref={cursorRef} className="streaming-cursor" />;

  return (
    <div>
      {sections.map((section) => {
        const showCursor = isStreaming && isLastSection(section.key);

        if (section.key === "vibe") {
          return (
            <div key={section.key} className="digest-vibe">
              <strong>
                {section.emoji} {section.label}
              </strong>
              <br />
              {section.content}
              {showCursor && cursor}
            </div>
          );
        }

        if (section.key === "stats") {
          return (
            <div key={section.key} className="digest-stats">
              {section.content}
              {showCursor && cursor}
            </div>
          );
        }

        const lines = section.content.split("\n").filter((l: string) => l.length > 0);
        const subtitle = lines[0] ?? "";
        const items = lines.slice(1).map((l: string) => l.replace(/^\s*\u2022\s*/, ""));

        return (
          <div key={section.key} className="digest-section">
            <div className="digest-section-title">
              {section.emoji} {section.label}
            </div>
            {subtitle && <div className="digest-section-subtitle">{subtitle}</div>}
            {items.map((item: string, i: number) => (
              <div key={i} className="digest-item">
                {item}
              </div>
            ))}
            {showCursor && <div className="digest-item">{cursor}</div>}
          </div>
        );
      })}
    </div>
  );
}

interface DigestViewProps {
  mode: "digest" | "resume" | "standup";
  digest: Digest | null;
  resume: string;
  standup: { yesterday: string[]; today: string[]; blockers: string[] };
  repoName: string;
  timeLabel: string;
  isStreaming: boolean;
  streamingText: string;
}

export function DigestView({ mode, isStreaming, streamingText }: DigestViewProps) {
  // Loading state
  if (isStreaming && !streamingText) {
    const loadingMessages: Record<string, string> = {
      digest: "Scout is sniffing through your commits...",
      standup: "Scout is putting together your standup...",
      resume: "Scout is building your AI context...",
    };
    return <div className="digest-loading">{loadingMessages[mode] ?? "Loading..."}</div>;
  }

  // Streaming in progress
  if (isStreaming && streamingText) {
    if (mode === "digest") {
      return <StreamingDigest text={streamingText} isStreaming />;
    }
    return (
      <div className="ai-context-card">
        <div className="ai-context-body">
          {streamingText}
          <span className="streaming-cursor" />
        </div>
      </div>
    );
  }

  // Completed
  if (streamingText) {
    if (mode === "digest") {
      return (
        <div>
          <StreamingDigest text={streamingText} isStreaming={false} />
          <CopyBtn text={streamingText} />
        </div>
      );
    }
    return (
      <div>
        <div className="ai-context-card">
          <div className="ai-context-body">{streamingText}</div>
        </div>
        <CopyBtn text={streamingText} />
      </div>
    );
  }

  // Empty state
  return <div className="digest-loading">Select a repo to generate your digest.</div>;
}
