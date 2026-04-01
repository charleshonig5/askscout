"use client";

import type { HistoryEntry } from "@/lib/mock-data";

interface SidebarProps {
  entries: HistoryEntry[];
  activeId: string | null;
  onSelect: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ entries, activeId, onSelect, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-content">
          <div className="sidebar-title">History</div>
          <div className="sidebar-subtitle">Last 30 days</div>

          <div className="sidebar-list">
            {entries.map((entry) => (
              <button
                key={entry.id}
                className={`sidebar-item ${activeId === entry.id ? "active" : ""}`}
                onClick={() => {
                  onSelect(entry.id);
                  onClose();
                }}
              >
                <div className="sidebar-item-top">
                  <span className="sidebar-item-date">{entry.date}</span>
                  {entry.shippedCount > 0 && (
                    <span className="sidebar-item-badge">
                      {"\ud83d\ude80"} {entry.shippedCount}
                    </span>
                  )}
                </div>
                <div className="sidebar-item-meta mono">
                  {entry.commits} commits {"\u00b7"} {entry.filesChanged} files
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
