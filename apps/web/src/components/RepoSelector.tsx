"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

interface RepoSelectorProps {
  repos: string[];
  /** Repos (owner/name) with Scout activity, most-recent first. Used for sort only. */
  activeRepos?: string[];
  selected: string;
  onChange: (repo: string) => void;
}

/**
 * Custom combobox replacing the native <select>. Scales to hundreds of repos:
 *   - search with fuzzy-ish substring match
 *   - keyboard navigation (↑↓, Enter, Esc, Home, End)
 *   - smart sort by default: selected → Scout-active by recency → rest
 *   - closes on outside click and Esc
 */
export function RepoSelector({ repos, activeRepos = [], selected, onChange }: RepoSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // The combobox is disabled until repos arrive. Prevents the user from
  // selecting a placeholder while the GitHub fetch is still in flight.
  const isLoading = repos.length === 0;

  // When no search: sort selected → active (by recency) → others (GitHub order).
  // When searching: pure substring-match score across all repos.
  const ordered = useMemo(() => {
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      return repos
        .filter((r) => r.toLowerCase().includes(q))
        .sort((a, b) => {
          // Prefer matches where the query appears in the repo name (after the /)
          // over matches where it's only in the owner part.
          const aName = a.split("/")[1]?.toLowerCase() ?? "";
          const bName = b.split("/")[1]?.toLowerCase() ?? "";
          const aHitName = aName.includes(q) ? 0 : 1;
          const bHitName = bName.includes(q) ? 0 : 1;
          if (aHitName !== bHitName) return aHitName - bHitName;
          // Then prefer prefix matches.
          const aPrefix = aName.startsWith(q) ? 0 : 1;
          const bPrefix = bName.startsWith(q) ? 0 : 1;
          if (aPrefix !== bPrefix) return aPrefix - bPrefix;
          // Stable alphabetical as final tiebreaker.
          return a.localeCompare(b);
        });
    }
    const activeSet = new Set(activeRepos);
    const selectedArr = selected && repos.includes(selected) ? [selected] : [];
    const activeOrdered = activeRepos.filter(
      (r) => r !== selected && repos.includes(r),
    );
    const rest = repos.filter((r) => r !== selected && !activeSet.has(r));
    return [...selectedArr, ...activeOrdered, ...rest];
  }, [repos, activeRepos, selected, query]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const handler = (e: Event) => {
      const target = e.target as Node | null;
      if (target && rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [open]);

  // When opening: focus search input on desktop, reset state.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIdx(0);
    // Don't auto-focus on touch devices — it pops the keyboard unexpectedly.
    const isTouch = typeof window !== "undefined" && "ontouchstart" in window;
    if (!isTouch) {
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  // Keep the active item scrolled into view when moving by keyboard.
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
    if (active) active.scrollIntoView({ block: "nearest" });
  }, [activeIdx, open]);

  // Clamp activeIdx if the filtered list shrinks below it.
  useEffect(() => {
    if (activeIdx >= ordered.length) setActiveIdx(Math.max(0, ordered.length - 1));
  }, [ordered, activeIdx]);

  // Close the popover AND return focus to the trigger button. Used for any
  // intentional close (Esc, Enter-select, click-select). For unintentional
  // closes (outside click, tab-away), we just close — the user moved focus
  // somewhere themselves and we shouldn't yank it back.
  const closeAndFocusTrigger = () => {
    setOpen(false);
    // Defer to next frame so the close-render finishes before we focus.
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const commit = (repo: string) => {
    if (repo && repo !== selected) onChange(repo);
    closeAndFocusTrigger();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, Math.max(0, ordered.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIdx(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIdx(Math.max(0, ordered.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const choice = ordered[activeIdx];
      if (choice) commit(choice);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeAndFocusTrigger();
    }
  };

  // Close when keyboard focus leaves the popover entirely (Tab away). This
  // uses React's onBlur which bubbles for non-input descendants. The
  // relatedTarget check ensures we don't close just because focus moved
  // BETWEEN children of the popover.
  const onRootBlur = (e: React.FocusEvent) => {
    if (!open) return;
    const next = e.relatedTarget as Node | null;
    if (next && rootRef.current?.contains(next)) return;
    setOpen(false);
  };

  const activeSet = useMemo(() => new Set(activeRepos), [activeRepos]);

  // Display only the repo name part (everything after the last "/"). The
  // combobox sits in a narrow sidebar — showing the full "owner/repo" ate
  // all the horizontal space and hid the part that actually identifies the
  // project. Internally we still use the full "owner/repo" slug for state,
  // URLs, API calls, etc. This is purely a display transform.
  const displayName = (slug: string): string => {
    const slash = slug.lastIndexOf("/");
    return slash === -1 ? slug : slug.slice(slash + 1);
  };

  // Trigger label: show the repo name of the current selection. Loading /
  // empty fallbacks stay as full phrases since there's no slug to strip.
  const triggerLabel = selected
    ? displayName(selected)
    : isLoading
      ? "Loading repositories..."
      : "Select a repo";

  return (
    <div className="repo-combobox" ref={rootRef} onBlur={onRootBlur}>
      <button
        ref={triggerRef}
        type="button"
        className="repo-combobox-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={isLoading}
        onClick={() => !isLoading && setOpen((v) => !v)}
      >
        <span className="repo-combobox-trigger-label">{triggerLabel}</span>
        <ChevronDown size={14} className="repo-combobox-chevron" aria-hidden />
      </button>

      {open && !isLoading && (
        <div className="repo-combobox-popover" role="dialog" onKeyDown={onKeyDown}>
          <div className="repo-combobox-search">
            <Search size={14} className="repo-combobox-search-icon" aria-hidden />
            <input
              ref={inputRef}
              type="text"
              className="repo-combobox-input"
              placeholder="Search repos..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIdx(0);
              }}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={open}
              aria-controls="repo-combobox-list"
            />
          </div>

          <div
            id="repo-combobox-list"
            role="listbox"
            className="repo-combobox-list"
            ref={listRef}
          >
            {ordered.length === 0 ? (
              <div className="repo-combobox-empty">
                {query.trim() ? `No repos match "${query.trim()}"` : "No repos available"}
              </div>
            ) : (
              ordered.map((repo, i) => {
                const isSelected = repo === selected;
                const isActive = i === activeIdx;
                const hasActivity = activeSet.has(repo);
                return (
                  <button
                    key={repo}
                    type="button"
                    data-idx={i}
                    role="option"
                    aria-selected={isSelected}
                    className={`repo-combobox-item${isActive ? " is-active" : ""}${
                      isSelected ? " is-selected" : ""
                    }`}
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => commit(repo)}
                  >
                    <span className="repo-combobox-item-name" title={repo}>
                      {displayName(repo)}
                    </span>
                    {hasActivity && !isSelected && (
                      <span className="repo-combobox-item-badge" aria-label="Scout activity">
                        {"\u2022"}
                      </span>
                    )}
                    {isSelected && (
                      <Check size={14} className="repo-combobox-item-check" aria-hidden />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
