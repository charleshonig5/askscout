"use client";

import { Fragment, useState, useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleX, Trash2, ShieldCheck, ShieldX } from "lucide-react";
import { Emoji } from "@/components/Emoji";
import { RepoSelector } from "@/components/RepoSelector";

/**
 * Settings page (Figma node 56:4092).
 *
 * Structure mirrors the digest page color story but inverted: the page wall
 * uses --color-bg-secondary and the centered card sits on top in
 * --color-bg-primary. Each section is a 527px-wide block with an emoji-led
 * header (label + desc) and a panel underneath. Sections are separated by
 * full-card dividers. All theming via tokens — no hardcoded hex.
 *
 * This pass establishes the shell + section scaffolding. Control internals
 * (toggle pill geometry, combobox styling, clear-row pills, privacy card
 * icons) get refined in subsequent passes.
 */

const SECTION_OPTIONS = [
  { key: "vibeCheck", label: "Vibe Check", desc: "Casual overview of your day" },
  { key: "shipped", label: "Shipped", desc: "New features and functionality" },
  { key: "changed", label: "Changed", desc: "Modifications to existing code" },
  { key: "unstable", label: "Still Shifting", desc: "Things that keep getting reworked" },
  { key: "leftOff", label: "Left Off", desc: "Where you stopped working" },
  {
    key: "oneTakeaway",
    label: "Key Takeaways",
    desc: "Scout's sign-off with a specific observation and a nudge",
  },
  {
    // The umbrella "Statistics" header in the digest sidebar always
    // shows whenever any quantitative sub-section is visible — that
    // header is intentionally NOT user-toggleable. This toggle
    // controls only the lines/commits/files cards underneath. Label
    // calls them "Commit Stats" so the toggle name doesn't collide
    // with the umbrella's name.
    key: "statistics",
    label: "Commit Stats",
    desc: "Lines added and removed, commits, and files changed",
  },
  {
    key: "mostActiveFiles",
    label: "Most Active Files",
    desc: "The files you touched most in a session",
  },
  {
    key: "codebaseHealth",
    label: "Codebase Health",
    desc: "Growth, focus, and churn indicators",
  },
  {
    key: "whenYouCoded",
    label: "Coding Timeline",
    desc: "Timeline of your commits across the day",
  },
  {
    key: "paceCheck",
    label: "Pace Check",
    desc: "Compare today's output to your rolling average",
  },
] as const;

const DEFAULT_SECTIONS: Record<string, boolean> = Object.fromEntries(
  SECTION_OPTIONS.map((s) => [s.key, true]),
);

const PRIVACY_READS = [
  "Commit messages and metadata",
  "Diff patches (the specific lines you added or removed)",
  "File names and paths",
];

const PRIVACY_NEVER = [
  "Full source files (only diff patches, never entire files)",
  "Environment variables, secrets, and API keys",
  "Dependencies, node_modules, and build artifacts",
];

export default function SettingsPage() {
  const router = useRouter();
  const [repos, setRepos] = useState<string[]>([]);
  /** Subset of `repos` that have at least one saved digest — i.e. things to
   *  actually clear. Drives the Clear History list so users don't see
   *  "Clear" buttons next to repos that have nothing to clear. */
  const [activeRepos, setActiveRepos] = useState<string[]>([]);
  const [defaultRepo, setDefaultRepo] = useState<string>("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [sectionPrefs, setSectionPrefs] = useState<Record<string, boolean>>(DEFAULT_SECTIONS);

  /** Refresh /api/repos. Pulled out so the Clear button can call it
   *  after a successful delete to drop the cleared repo from the list. */
  const refreshRepos = useCallback(async () => {
    try {
      const res = await fetch("/api/repos");
      if (res.ok) {
        const data = (await res.json()) as { repos: string[]; activeRepos?: string[] };
        setRepos(data.repos);
        setActiveRepos(data.activeRepos ?? []);
      }
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const [reposRes, settingsRes] = await Promise.all([
          fetch("/api/repos"),
          fetch("/api/settings"),
        ]);
        if (reposRes.ok) {
          const data = (await reposRes.json()) as {
            repos: string[];
            activeRepos?: string[];
          };
          setRepos(data.repos);
          setActiveRepos(data.activeRepos ?? []);
        }
        if (settingsRes.ok) {
          const data = (await settingsRes.json()) as {
            default_repo: string | null;
            digest_sections: Record<string, boolean> | null;
          };
          if (data.default_repo) setDefaultRepo(data.default_repo);
          if (data.digest_sections) {
            setSectionPrefs({ ...DEFAULT_SECTIONS, ...data.digest_sections });
          }
        }
      } catch {
        /* silent */
      }
    })();
  }, []);

  const saveDefaultRepo = useCallback(async (repo: string) => {
    setDefaultRepo(repo);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ default_repo: repo }),
      });
    } catch {
      /* silent */
    }
  }, []);

  const deleteRepoHistory = useCallback(
    async (repo: string) => {
      try {
        await fetch(`/api/account?action=delete-repo-history&repo=${encodeURIComponent(repo)}`, {
          method: "DELETE",
        });
        setConfirmDelete(null);
        // Refetch active repos so the cleared repo drops out of the
        // Clear History list immediately. Without this, a row would
        // sit there with a "Clear" button that does nothing.
        void refreshRepos();
      } catch {
        /* silent */
      }
    },
    [refreshRepos],
  );

  /** Wipe all saved digests across every repo. Heavier scope than
   *  per-row Clear, so it runs through a centered modal confirm
   *  (the same .modal primitives the Standup / Plan / AI Context
   *  modals use) rather than the inline confirm pattern. */
  /** Clear-All flow state. `submitting` disables the Cancel + Confirm
   *  buttons during the in-flight request (prevents double-clicks).
   *  `error` surfaces backend failures inline in the modal so the user
   *  knows the deletion didn't actually go through. */
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const [clearAllSubmitting, setClearAllSubmitting] = useState(false);
  const [clearAllError, setClearAllError] = useState<string | null>(null);

  const openClearAll = useCallback(() => {
    setClearAllError(null);
    setClearAllOpen(true);
  }, []);
  const cancelClearAll = useCallback(() => {
    if (clearAllSubmitting) return;
    setClearAllOpen(false);
  }, [clearAllSubmitting]);

  const deleteAllHistory = useCallback(async () => {
    setClearAllSubmitting(true);
    setClearAllError(null);
    try {
      const res = await fetch("/api/account?action=delete-all-history", { method: "DELETE" });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      setClearAllOpen(false);
      await refreshRepos();
    } catch {
      setClearAllError("Couldn't clear history. Please try again.");
    } finally {
      setClearAllSubmitting(false);
    }
  }, [refreshRepos]);

  /** Delete-Account flow state — same submitting / error pattern as
   *  Clear All. Wipes the user's entire footprint in Scout (saved
   *  digests, settings, check-ins) then signs them out. Required for
   *  right-to-erasure compliance (GDPR / CCPA) and basic trust:
   *  revoking the GitHub OAuth grant on github.com only stops new
   *  reads, it doesn't touch data already stored in Supabase. */
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteAccountSubmitting, setDeleteAccountSubmitting] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  const openDeleteAccount = useCallback(() => {
    setDeleteAccountError(null);
    setDeleteAccountOpen(true);
  }, []);
  const cancelDeleteAccount = useCallback(() => {
    if (deleteAccountSubmitting) return;
    setDeleteAccountOpen(false);
  }, [deleteAccountSubmitting]);

  const deleteAccount = useCallback(async () => {
    setDeleteAccountSubmitting(true);
    setDeleteAccountError(null);
    try {
      // Phase 1: delete the data. Surface any server error inline so
      // the user knows the account is still alive and they can retry.
      const res = await fetch("/api/account?action=delete-account", { method: "DELETE" });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
    } catch {
      setDeleteAccountError("Couldn't delete your account. Please try again.");
      setDeleteAccountSubmitting(false);
      return;
    }
    // Phase 2: data is gone. Sign out + redirect to landing. Failures
    // here are rare (NextAuth client-side); on a soft failure the user
    // would land in a logged-in-but-no-data state on next render. Hard
    // navigate as a fallback so they always end up on a clean page.
    try {
      await signOut({ callbackUrl: "/" });
    } catch {
      window.location.href = "/";
    }
  }, []);

  const toggleSection = useCallback(
    async (key: string, enabled: boolean) => {
      const updated = { ...sectionPrefs, [key]: enabled };
      setSectionPrefs(updated);
      try {
        await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ digest_sections: updated }),
        });
      } catch {
        setSectionPrefs((prev) => ({ ...prev, [key]: !enabled }));
      }
    },
    [sectionPrefs],
  );

  const goBack = () => router.push("/dashboard");

  return (
    <div className="settings-page">
      <div className="settings-card">
        {/* Header strip — back pill + Settings title on the left,
            Close button on the right, divider underneath. */}
        <div className="settings-header">
          <div className="settings-header-left">
            <button type="button" className="settings-back-pill" onClick={goBack}>
              <ArrowLeft size={10} strokeWidth={1} aria-hidden />
              Back to Digest
            </button>
            <h1 className="settings-title">Settings</h1>
          </div>
          <button
            type="button"
            className="settings-close-btn"
            onClick={goBack}
            aria-label="Close settings"
          >
            <CircleX size={20} strokeWidth={1} aria-hidden />
            <span>Close</span>
          </button>
        </div>
        <hr className="settings-header-divider" />

        <div className="settings-content">
          {/* Default Repository */}
          <section className="settings-section">
            <header className="settings-section-head">
              <div className="settings-section-title">
                <Emoji name="defaultRepo" size={20} />
                <h2>Default Repository</h2>
              </div>
              <p className="settings-section-desc">The repo that loads when you open askscout.</p>
            </header>
            <RepoSelector
              repos={repos}
              selected={defaultRepo}
              onChange={(repo) => void saveDefaultRepo(repo)}
              variant="settings"
              hideActivityBadge
              showDynamicDefault
              placeholder="Most recently pushed"
            />
          </section>

          <hr className="settings-divider" />

          {/* Customize Digest */}
          <section className="settings-section">
            <header className="settings-section-head">
              <div className="settings-section-title">
                <Emoji name="customize" size={20} />
                <h2>Customize Digest</h2>
              </div>
              <p className="settings-section-desc">
                Choose which sections appear in your digest. Changes are saved automatically.
              </p>
            </header>
            <div className="settings-panel settings-panel--toggles">
              {SECTION_OPTIONS.map((opt, i) => (
                <Fragment key={opt.key}>
                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <span className="settings-toggle-label">{opt.label}</span>
                      <span className="settings-toggle-desc">{opt.desc}</span>
                    </div>
                    <label className="settings-switch" aria-label={`Toggle ${opt.label}`}>
                      <input
                        type="checkbox"
                        checked={sectionPrefs[opt.key] !== false}
                        onChange={(e) => void toggleSection(opt.key, e.target.checked)}
                      />
                      <span className="settings-switch-track" aria-hidden />
                      <span className="settings-switch-thumb" aria-hidden />
                    </label>
                  </div>
                  {i < SECTION_OPTIONS.length - 1 && (
                    <hr className="settings-row-divider" aria-hidden />
                  )}
                </Fragment>
              ))}
            </div>
          </section>

          <hr className="settings-divider" />

          {/* Clear History */}
          <section className="settings-section">
            <header className="settings-section-head">
              <div className="settings-section-title-row">
                <div className="settings-section-title">
                  <Emoji name="clearHistory" size={20} />
                  <h2>Clear History</h2>
                </div>
                {/* Section-level action — sits in the title row, right-
                    aligned, gated on having history to clear. Triggers
                    the confirm modal mounted at page bottom. */}
                {activeRepos.length > 0 && (
                  <button
                    type="button"
                    className="settings-clear-all-btn"
                    onClick={openClearAll}
                  >
                    <Trash2 size={16} strokeWidth={1} aria-hidden />
                    Clear All History
                  </button>
                )}
              </div>
              <p className="settings-section-desc">
                Delete past digests. This cannot be undone.
              </p>
            </header>
            <div className="settings-panel settings-panel--repos">
              {activeRepos.length === 0 ? (
                <p className="settings-empty">
                  No history to clear yet. Repos with saved digests will appear here.
                </p>
              ) : (
                activeRepos.map((repo, i) => (
                  <Fragment key={repo}>
                    <div className="settings-repo-row">
                      <span className="settings-repo-name" title={repo}>
                        {repo}
                      </span>
                      {confirmDelete === `repo:${repo}` ? (
                        <span className="settings-repo-confirm">
                          <button
                            type="button"
                            className="settings-clear-pill settings-clear-pill--confirm"
                            onClick={() => void deleteRepoHistory(repo)}
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            className="settings-clear-pill"
                            onClick={() => setConfirmDelete(null)}
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="settings-clear-pill"
                          onClick={() => setConfirmDelete(`repo:${repo}`)}
                        >
                          Clear
                          <Trash2 size={10} strokeWidth={1} aria-hidden />
                        </button>
                      )}
                    </div>
                    {i < activeRepos.length - 1 && (
                      <hr className="settings-row-divider" aria-hidden />
                    )}
                  </Fragment>
                ))
              )}
            </div>
          </section>

          <hr className="settings-divider" />

          {/* Privacy & Security */}
          <section className="settings-section">
            <header className="settings-section-head">
              <div className="settings-section-title">
                <Emoji name="privacy" size={20} />
                <h2>Privacy &amp; Security</h2>
              </div>
              <p className="settings-section-desc">
                Scout is read-only. Here is exactly what we access and what we don&apos;t.
              </p>
            </header>
            <div className="settings-privacy-grid">
              <div className="settings-privacy-card">
                <h3 className="settings-privacy-card-title">What Scout reads</h3>
                <ul className="settings-privacy-list">
                  {PRIVACY_READS.map((item) => (
                    <li key={item} className="settings-privacy-item">
                      <ShieldCheck
                        size={20}
                        strokeWidth={1}
                        aria-hidden
                        className="settings-privacy-icon settings-privacy-icon--safe"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="settings-privacy-card">
                <h3 className="settings-privacy-card-title">What Scout never touches</h3>
                <ul className="settings-privacy-list">
                  {PRIVACY_NEVER.map((item) => (
                    <li key={item} className="settings-privacy-item">
                      <ShieldX
                        size={20}
                        strokeWidth={1}
                        aria-hidden
                        className="settings-privacy-icon settings-privacy-icon--never"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="settings-privacy-footer">
              No raw code is stored. Scout never writes to your repository.
            </p>
          </section>

          <hr className="settings-divider" />

          {/* Danger Zone — account deletion. Same section primitive
              as the others: emoji + title + desc, with a right-aligned
              danger action in the title row (mirrors Clear History).
              Reuses .settings-clear-all-btn since the visual treatment
              is identical (section-level danger pill). */}
          <section className="settings-section">
            <header className="settings-section-head">
              <div className="settings-section-title-row">
                <div className="settings-section-title">
                  <Emoji name="dangerZone" size={20} />
                  <h2>Danger Zone</h2>
                </div>
                <button
                  type="button"
                  className="settings-clear-all-btn"
                  onClick={openDeleteAccount}
                >
                  <Trash2 size={16} strokeWidth={1} aria-hidden />
                  Delete Account
                </button>
              </div>
              <p className="settings-section-desc">
                Permanently delete your account and all data. This cannot be undone.
              </p>
            </header>
          </section>
        </div>
      </div>

      {/* Clear-All confirm — uses the site's modal primitives
          (.modal-overlay / .modal / .modal-top / .modal-action-btn)
          so this sits in the same design family as Standup / Plan /
          AI Context modals and the sidebar sign-out confirm. */}
      {clearAllOpen && (
        <>
          <div className="modal-overlay" onClick={cancelClearAll} aria-hidden />
          <div
            className="modal modal--confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-all-title"
          >
            <div className="modal-top">
              <div className="modal-identity">
                <h2 id="clear-all-title" className="modal-title">
                  Clear all digest history?
                </h2>
                <p className="modal-subtitle">
                  This deletes every saved digest across all repos. This cannot be undone.
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={cancelClearAll}
                aria-label="Close"
                disabled={clearAllSubmitting}
              >
                <CircleX size={20} strokeWidth={1} aria-hidden />
              </button>
            </div>
            <div className="modal-divider" aria-hidden />
            {clearAllError && (
              <p className="modal-error" role="alert">
                {clearAllError}
              </p>
            )}
            <div className="modal-footer modal-footer--split">
              <button
                type="button"
                className="modal-action-btn"
                onClick={cancelClearAll}
                disabled={clearAllSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-action-btn modal-action-btn--danger"
                onClick={() => void deleteAllHistory()}
                disabled={clearAllSubmitting}
              >
                {clearAllSubmitting ? "Clearing…" : "Yes, clear all"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete-Account confirm — same modal primitives as Clear All
          but with stronger language since the action is heavier
          scope (wipes data AND signs the user out). */}
      {deleteAccountOpen && (
        <>
          <div className="modal-overlay" onClick={cancelDeleteAccount} aria-hidden />
          <div
            className="modal modal--confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
          >
            <div className="modal-top">
              <div className="modal-identity">
                <h2 id="delete-account-title" className="modal-title">
                  Delete your account?
                </h2>
                <p className="modal-subtitle">
                  This permanently deletes your account, all saved digests, settings, and
                  history. You&apos;ll need to sign back in with GitHub to use Scout again.
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={cancelDeleteAccount}
                aria-label="Close"
                disabled={deleteAccountSubmitting}
              >
                <CircleX size={20} strokeWidth={1} aria-hidden />
              </button>
            </div>
            <div className="modal-divider" aria-hidden />
            {deleteAccountError && (
              <p className="modal-error" role="alert">
                {deleteAccountError}
              </p>
            )}
            <div className="modal-footer modal-footer--split">
              <button
                type="button"
                className="modal-action-btn"
                onClick={cancelDeleteAccount}
                disabled={deleteAccountSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-action-btn modal-action-btn--danger"
                onClick={() => void deleteAccount()}
                disabled={deleteAccountSubmitting}
              >
                {deleteAccountSubmitting ? "Deleting…" : "Yes, delete account"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
