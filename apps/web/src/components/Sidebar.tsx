"use client";

import { GitCommit, FileText, Rocket, Wrench, AlertTriangle, Clock } from "lucide-react";
import type { HistoryEntry } from "@/lib/mock-data";
import { RepoSelector } from "./RepoSelector";

interface SidebarProps {
  entries: HistoryEntry[];
  activeId: string | null;
  onSelect: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  /** Repo picker lives at the top of the sidebar. Dashboard owns the list +
   *  selection and passes them through so history + repo context live
   *  together. */
  repos: string[];
  activeRepos?: string[];
  selectedRepo: string;
  onRepoChange: (repo: string) => void;
}

export function Sidebar({
  entries,
  activeId,
  onSelect,
  isOpen,
  onClose,
  repos,
  activeRepos,
  selectedRepo,
  onRepoChange,
}: SidebarProps) {
  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-content">
          <div className="sidebar-section sidebar-section--repo">
            <div className="sidebar-title">Repo</div>
            <RepoSelector
              repos={repos}
              activeRepos={activeRepos}
              selected={selectedRepo}
              onChange={onRepoChange}
            />
          </div>

          <div className="sidebar-title sidebar-title--history">
            <Clock size={14} /> History
          </div>
          <div className="sidebar-subtitle">Last 30 days</div>

          <div className="sidebar-list">
            {entries.length === 0 && (
              <div className="sidebar-empty">History will appear here as you generate digests.</div>
            )}
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
                  <div className="sidebar-item-metrics">
                    <span className="sidebar-item-metric">
                      <GitCommit size={10} /> {entry.commits}
                    </span>
                    <span className="sidebar-item-metric">
                      <FileText size={10} /> {entry.filesChanged}
                    </span>
                  </div>
                </div>
                <div className="sidebar-item-metrics">
                  {entry.shippedCount > 0 && (
                    <span className="sidebar-item-metric sidebar-item-metric--shipped">
                      <Rocket size={10} /> {entry.shippedCount}
                    </span>
                  )}
                  {entry.changedCount > 0 && (
                    <span className="sidebar-item-metric sidebar-item-metric--changed">
                      <Wrench size={10} /> {entry.changedCount}
                    </span>
                  )}
                  {entry.unstableCount > 0 && (
                    <span className="sidebar-item-metric sidebar-item-metric--unstable">
                      <AlertTriangle size={10} /> {entry.unstableCount}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
