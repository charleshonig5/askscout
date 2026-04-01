"use client";

import type { HistoryEntry } from "@/lib/mock-data";

interface HistoryListProps {
  entries: HistoryEntry[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function HistoryList({ entries, activeId, onSelect }: HistoryListProps) {
  return (
    <div className="history-list">
      <div className="history-header">
        <span className="history-title">History</span>
        <span className="text-tertiary" style={{ fontSize: 12 }}>
          Last 30 days
        </span>
      </div>
      {entries.map((entry) => (
        <button
          key={entry.id}
          className={`history-item ${activeId === entry.id ? "active" : ""}`}
          onClick={() => onSelect(entry.id)}
        >
          <div className="history-item-top">
            <span className="history-date">{entry.date}</span>
            <span className="history-stats mono">
              {entry.commits} commits {"\u00b7"} {entry.filesChanged} files
            </span>
          </div>
          <div className="history-vibe">{entry.vibeCheck}</div>
          {entry.shippedCount > 0 && (
            <div className="history-shipped">
              {"\ud83d\ude80"} {entry.shippedCount} shipped
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
