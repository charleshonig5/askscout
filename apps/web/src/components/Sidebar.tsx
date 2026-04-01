"use client";

import type { HistoryEntry } from "@/lib/mock-data";
import { ThemeToggle } from "./ThemeToggle";

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
      {/* Mobile overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-content">
          {/* History */}
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <span>History</span>
              <span className="text-tertiary" style={{ fontSize: 11 }}>
                Last 30 days
              </span>
            </div>
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
        </div>

        {/* Bottom section */}
        <div className="sidebar-footer">
          <button className="sidebar-footer-btn">{"\u2699\ufe0f"} Settings</button>
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
