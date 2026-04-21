"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  GitCommit,
  FileText,
  Rocket,
  Wrench,
  AlertTriangle,
  Clock,
  Settings,
  LogOut,
  ChevronUp,
} from "lucide-react";
import type { HistoryEntry } from "@/lib/mock-data";
import { RepoSelector } from "./RepoSelector";
import { ThemeToggle } from "./ThemeToggle";

interface SidebarProps {
  entries: HistoryEntry[];
  activeId: string | null;
  onSelect: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
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
  const { data: session } = useSession();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const avatarUrl = session?.user?.image;
  // Prefer the GitHub @handle. Fall back to display name, then generic "User".
  const userHandle = session?.user?.login ?? session?.user?.name ?? "User";

  // Close the profile popover when clicking outside it.
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* TOP: logo + theme + settings */}
        <div className="sidebar-top">
          <span className="sidebar-logo">askscout</span>
          <div className="sidebar-top-actions">
            <ThemeToggle />
            <button
              className="header-icon-btn"
              onClick={() => router.push("/settings")}
              aria-label="Settings"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* MIDDLE: scrollable content (repo + history) */}
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

        {/* BOTTOM: profile row; click to open sign-out popover */}
        <div className="sidebar-bottom" ref={profileRef}>
          <button
            className={`sidebar-profile-btn${profileOpen ? " is-open" : ""}`}
            onClick={() => setProfileOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={profileOpen}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={userHandle}
                width={28}
                height={28}
                className="sidebar-profile-avatar"
              />
            ) : (
              <div className="sidebar-profile-avatar sidebar-profile-avatar--placeholder" />
            )}
            <span className="sidebar-profile-text">
              <span className="sidebar-profile-name">{userHandle}</span>
              <span className="sidebar-profile-provider">GitHub</span>
            </span>
            <ChevronUp
              size={14}
              className={`sidebar-profile-chevron${profileOpen ? " is-open" : ""}`}
              aria-hidden
            />
          </button>
          {profileOpen && (
            <div className="sidebar-profile-menu" role="menu">
              <button
                className="sidebar-profile-menu-item"
                onClick={() => void signOut({ callbackUrl: "/" })}
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
