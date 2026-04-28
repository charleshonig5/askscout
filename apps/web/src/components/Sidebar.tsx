"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChartNoAxesCombined,
  CircleX,
  FileText,
  GitCommitHorizontal,
  HelpCircle,
  LogOut,
  Settings2,
  SquareArrowUpRight,
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

/**
 * Left navigation.
 *
 * Pixel-mapped from the Figma frame (node 127:2411):
 *   - 372px total width, 24px internal padding.
 *   - Logo row (25×25 mark + "AskScout" in Pridi 24) + theme & settings icons.
 *   - Repo picker block (label + 44px combobox).
 *   - History block (label + scrolling list; active row is an elevated card
 *     with a top inner-glow; each row shows +lines / -lines / commits / files
 *     and a top-right external-link arrow).
 *   - Footer: divider, avatar (GitHub image; green circle is placeholder
 *     only), display name + "GitHub" provider, sign-out icon. Clicking the
 *     sign-out icon opens an inline confirmation popover pinned directly
 *     above the profile row.
 */
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
  const [signOutOpen, setSignOutOpen] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);

  const avatarUrl = session?.user?.image;
  // Prefer the GitHub @handle. Fall back to display name, then generic "User".
  const userHandle = session?.user?.login ?? session?.user?.name ?? "User";

  // Close the anchored sign-out popover on outside click or Esc so it
  // doesn't linger once the user has moved on.
  useEffect(() => {
    if (!signOutOpen) return;
    const clickHandler = (e: MouseEvent) => {
      if (footerRef.current && !footerRef.current.contains(e.target as Node)) {
        setSignOutOpen(false);
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSignOutOpen(false);
    };
    document.addEventListener("mousedown", clickHandler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", clickHandler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [signOutOpen]);

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* TOP HALF: logo row, repo picker, history list. */}
        <div className="sidebar-main">
          <div className="sidebar-top">
            <div className="sidebar-brand">
              <span className="sidebar-brand-mark" aria-hidden />
              <span className="sidebar-brand-name">AskScout</span>
            </div>
            <div className="sidebar-top-actions">
              <ThemeToggle />
              <button
                className="header-icon-btn"
                onClick={() => router.push("/insights")}
                aria-label="Insights"
              >
                <ChartNoAxesCombined size={20} strokeWidth={1} />
              </button>
              <button
                className="header-icon-btn"
                onClick={() => router.push("/settings")}
                aria-label="Settings"
              >
                <Settings2 size={20} strokeWidth={1} />
              </button>
            </div>
          </div>

          <div className="sidebar-content">
            <div className="sidebar-section sidebar-section--repo">
              <div className="sidebar-title">
                Repo
                <span
                  className="sidebar-title-help"
                  aria-label="Each repo has its own digest and history. Switch any time."
                >
                  <HelpCircle size={16} strokeWidth={1} aria-hidden />
                  <span className="sidebar-title-tooltip" role="tooltip">
                    Each repo has its own digest and history. Switch any time.
                  </span>
                </span>
              </div>
              <RepoSelector
                repos={repos}
                activeRepos={activeRepos}
                selected={selectedRepo}
                onChange={onRepoChange}
              />
            </div>

            <div className="sidebar-section sidebar-section--history">
              <div className="sidebar-title">
                History
                <span
                  className="sidebar-title-help"
                  aria-label="Past 30 days of digests. Click to revisit."
                >
                  <HelpCircle size={16} strokeWidth={1} aria-hidden />
                  <span className="sidebar-title-tooltip" role="tooltip">
                    Past 30 days of digests. Click to revisit.
                  </span>
                </span>
              </div>

              <div className="sidebar-list">
                {entries.length === 0 && (
                  <div className="sidebar-empty">
                    History will appear here as you generate digests.
                  </div>
                )}
                {entries.map((entry) => {
                  const isActive = activeId === entry.id;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      className={`sidebar-item${isActive ? " active" : ""}`}
                      onClick={() => {
                        onSelect(entry.id);
                        onClose();
                      }}
                    >
                      <div className="sidebar-item-body">
                        <span className="sidebar-item-date">{entry.date}</span>
                        <div className="sidebar-item-stats">
                          <span className="sidebar-item-stat sidebar-item-stat--added">
                            +{entry.linesAdded}
                          </span>
                          <span className="sidebar-item-stat sidebar-item-stat--removed">
                            -{entry.linesRemoved}
                          </span>
                          <span className="sidebar-item-stat">
                            {entry.commits}
                            <GitCommitHorizontal
                              size={16}
                              strokeWidth={1}
                              className="commit-icon"
                              aria-hidden
                            />
                          </span>
                          <span className="sidebar-item-stat">
                            {entry.filesChanged}
                            <FileText size={12} strokeWidth={1} className="file-icon" aria-hidden />
                          </span>
                        </div>
                      </div>
                      <span className="sidebar-item-open" aria-hidden>
                        <SquareArrowUpRight size={20} strokeWidth={1} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER: profile row + anchored sign-out confirm. The
            confirm stays anchored above the profile row but uses
            the same internal structure as the centered Clear All
            and Delete Account modals (modal-top + modal-identity +
            close button + modal-divider + modal-footer--split) so
            all three secondary modals read identical visually. */}
        <div className="sidebar-bottom" ref={footerRef}>
          {signOutOpen && (
            <div
              className="sidebar-signout-confirm"
              role="dialog"
              aria-modal="false"
              aria-labelledby="signout-title"
            >
              <div className="modal-top">
                <div className="modal-identity">
                  <h2 id="signout-title" className="modal-title">
                    Sign out of Scout?
                  </h2>
                  <p className="modal-subtitle">
                    You&apos;ll need to sign back in with GitHub to see new digests.
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setSignOutOpen(false)}
                  aria-label="Close"
                >
                  <CircleX size={20} strokeWidth={1} aria-hidden />
                </button>
              </div>
              <div className="modal-divider" aria-hidden />
              <div className="modal-footer modal-footer--split">
                <button
                  type="button"
                  className="modal-action-btn"
                  onClick={() => setSignOutOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="modal-action-btn modal-action-btn--danger"
                  onClick={() => void signOut({ callbackUrl: "/" })}
                >
                  Sign out
                </button>
              </div>
            </div>
          )}

          <div className="sidebar-profile-row">
            <div className="sidebar-profile-identity">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={userHandle}
                  width={44}
                  height={44}
                  className="sidebar-profile-avatar"
                />
              ) : (
                <div
                  className="sidebar-profile-avatar sidebar-profile-avatar--placeholder"
                  aria-hidden
                />
              )}
              <div className="sidebar-profile-text">
                <span className="sidebar-profile-name">{userHandle}</span>
                <span className="sidebar-profile-provider">GitHub</span>
              </div>
            </div>
            <button
              type="button"
              className="sidebar-signout-btn"
              onClick={() => setSignOutOpen((v) => !v)}
              aria-label="Sign out"
              aria-haspopup="dialog"
              aria-expanded={signOutOpen}
            >
              <LogOut size={20} strokeWidth={1} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
