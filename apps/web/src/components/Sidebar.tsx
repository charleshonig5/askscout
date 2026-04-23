"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  GitCommit,
  FileText,
  SquareArrowOutUpRight,
  HelpCircle,
  SlidersHorizontal,
  LogOut,
} from "lucide-react";
import type { HistoryEntry } from "@/lib/mock-data";
import { RepoSelector } from "./RepoSelector";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Sidebar — left navigation rail.
 *
 * Pixel-spec sourced from the high-fidelity Figma. Built with Tailwind
 * utilities resolving through Scout's design tokens (colors, spacing,
 * fonts) so dark/light mode and palette updates flow through without
 * touching this component.
 *
 * Typography:
 *   - Pridi (font-display) — wordmark only ("AskScout")
 *   - Work Sans (font-sans) — every other label, button, list item
 *
 * Surface model (dark mode values shown):
 *   - Sidebar bg     → bg-bg-secondary  (#121212 — outer chrome tone)
 *   - Active item bg → bg-bg-tertiary   (#1E1E1E — slightly elevated)
 *   - Repo dropdown  → bg-bg-secondary + border-border outline
 *   - Divider        → border-border    (#222222)
 *   - Avatar fallback→ bg-success       (brand green placeholder)
 */
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
      {/* Mobile-only overlay; click to close the sidebar. */}
      {isOpen && (
        <div className="fixed inset-0 z-[10] bg-black/50 md:hidden" onClick={onClose} aria-hidden />
      )}

      <aside
        className={`fixed top-0 left-0 z-[15] flex h-screen w-96 flex-col bg-bg-secondary transition-transform duration-200 ease-out md:z-[5] md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Inner padding container — 24px from each edge */}
        <div className="flex h-full flex-col px-6 py-6">
          {/* ── TOP STACK: logo row + repo + history ─────────────────────── */}
          <div className="flex flex-1 min-h-0 flex-col gap-6">
            {/* Logo + top-right actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                {/* Logo mark — placeholder white square; swap for real
                    SVG mark when available */}
                <div className="h-6 w-6 rounded-md bg-text-primary" />
                <span className="font-display text-2xl font-normal text-text-primary">
                  AskScout
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => router.push("/settings")}
                  aria-label="Settings"
                  className="flex h-5 w-5 items-center justify-center text-text-primary transition-opacity hover:opacity-80"
                >
                  <SlidersHorizontal size={20} strokeWidth={1} />
                </button>
                <ThemeToggle />
              </div>
            </div>

            {/* Repo section */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1">
                <span className="text-base font-normal text-text-tertiary">Repo</span>
                <HelpCircle size={16} strokeWidth={1} className="text-text-tertiary" />
              </div>
              <RepoSelector
                repos={repos}
                activeRepos={activeRepos}
                selected={selectedRepo}
                onChange={onRepoChange}
              />
            </div>

            {/* History section — flex-1 so the list takes remaining height */}
            <div className="flex flex-1 min-h-0 flex-col gap-3.5">
              <div className="flex items-center gap-1">
                <span className="text-base font-normal text-text-tertiary">History</span>
                <HelpCircle size={16} strokeWidth={1} className="text-text-tertiary" />
              </div>

              <div
                className="flex flex-col overflow-y-auto"
                style={
                  {
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  } as React.CSSProperties
                }
              >
                {entries.length === 0 && (
                  <div className="px-3.5 py-4 text-xs text-text-tertiary">
                    History will appear here as you generate digests.
                  </div>
                )}

                {entries.map((entry) => {
                  const isActive = activeId === entry.id;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => {
                        onSelect(entry.id);
                        onClose();
                      }}
                      className={`group flex items-start justify-between gap-2 rounded-lg px-3.5 py-3.5 text-left transition-colors ${
                        isActive
                          ? "bg-bg-tertiary shadow-[inset_0px_8px_20px_0px_rgba(255,255,255,0.04)]"
                          : "hover:bg-bg-tertiary/50"
                      }`}
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-base font-medium text-text-primary truncate">
                          {entry.date}
                        </span>
                        <div className="flex items-center gap-3.5">
                          <span className="text-xs font-normal text-success">
                            +{entry.linesAdded ?? 425}
                          </span>
                          <span className="text-xs font-normal text-danger">
                            -{entry.linesRemoved ?? 86}
                          </span>
                          <span className="flex items-center gap-1 text-xs font-normal text-text-primary">
                            {entry.commits}
                            <GitCommit size={16} strokeWidth={1} className="text-text-tertiary" />
                          </span>
                          <span className="flex items-center gap-1 text-xs font-normal text-text-primary">
                            {entry.filesChanged}
                            <FileText size={16} strokeWidth={1} className="text-text-tertiary" />
                          </span>
                        </div>
                      </div>

                      <SquareArrowOutUpRight
                        size={20}
                        strokeWidth={1}
                        className={`flex-shrink-0 mt-0.5 ${
                          isActive ? "text-text-primary" : "text-text-tertiary"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── BOTTOM STACK: divider + profile row ──────────────────────── */}
          <div className="flex flex-col gap-6 pt-6" ref={profileRef}>
            <div className="h-px bg-border" />

            <div className="relative flex items-center justify-between">
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                className="flex items-center gap-3.5 rounded-md text-left transition-opacity hover:opacity-80"
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={userHandle}
                    width={44}
                    height={44}
                    className="h-11 w-11 flex-shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-11 w-11 flex-shrink-0 rounded-full bg-success" aria-hidden />
                )}
                <div className="flex flex-col leading-tight">
                  <span className="text-base font-normal text-text-primary">{userHandle}</span>
                  <span className="text-base font-normal text-text-tertiary">GitHub</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => void signOut({ callbackUrl: "/" })}
                aria-label="Sign out"
                className="flex h-5 w-5 items-center justify-center text-text-primary transition-opacity hover:opacity-80"
              >
                <LogOut size={20} strokeWidth={1} />
              </button>

              {profileOpen && (
                <div
                  className="absolute bottom-full left-0 right-0 mb-2 rounded-md border border-border bg-bg-elevated p-1 shadow-md z-20"
                  role="menu"
                >
                  <button
                    type="button"
                    onClick={() => void signOut({ callbackUrl: "/" })}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm text-text-primary transition-colors hover:bg-bg-tertiary"
                  >
                    <LogOut size={14} strokeWidth={1} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
