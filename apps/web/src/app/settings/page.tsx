"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleX, Trash2, CircleCheck, CircleSlash } from "lucide-react";
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
  const [defaultRepo, setDefaultRepo] = useState<string>("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [sectionPrefs, setSectionPrefs] = useState<Record<string, boolean>>(DEFAULT_SECTIONS);

  useEffect(() => {
    void (async () => {
      try {
        const [reposRes, settingsRes] = await Promise.all([
          fetch("/api/repos"),
          fetch("/api/settings"),
        ]);
        if (reposRes.ok) {
          const data = (await reposRes.json()) as { repos: string[] };
          setRepos(data.repos);
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

  const deleteRepoHistory = useCallback(async (repo: string) => {
    try {
      await fetch(`/api/account?action=delete-repo-history&repo=${encodeURIComponent(repo)}`, {
        method: "DELETE",
      });
      setConfirmDelete(null);
    } catch {
      /* silent */
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
                <div className="settings-toggle-row" key={opt.key}>
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
                  {i < SECTION_OPTIONS.length - 1 && (
                    <hr className="settings-row-divider" aria-hidden />
                  )}
                </div>
              ))}
            </div>
          </section>

          <hr className="settings-divider" />

          {/* Clear History */}
          <section className="settings-section">
            <header className="settings-section-head">
              <div className="settings-section-title">
                <Emoji name="clearHistory" size={20} />
                <h2>Clear History</h2>
              </div>
              <p className="settings-section-desc">
                Delete past digests. This cannot be undone.
              </p>
            </header>
            <div className="settings-panel settings-panel--repos">
              {repos.length === 0 ? (
                <p className="settings-empty">No repos to clear.</p>
              ) : (
                repos.map((repo, i) => (
                  <div className="settings-repo-row" key={repo}>
                    <span className="settings-repo-name">{repo}</span>
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
                    {i < repos.length - 1 && (
                      <hr className="settings-row-divider" aria-hidden />
                    )}
                  </div>
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
                      <CircleCheck
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
                      <CircleSlash
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
        </div>
      </div>
    </div>
  );
}
