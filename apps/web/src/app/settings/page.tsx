"use client";

import { useState, useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, AlertTriangle } from "lucide-react";

const SECTION_OPTIONS = [
  { key: "vibeCheck", label: "Vibe Check", desc: "Casual overview of your day" },
  { key: "shipped", label: "Shipped", desc: "New features and functionality" },
  { key: "changed", label: "Changed", desc: "Modifications to existing code" },
  { key: "unstable", label: "Still Shifting", desc: "Things that keep getting reworked" },
  { key: "leftOff", label: "Left Off", desc: "Where you stopped working" },
  {
    key: "oneTakeaway",
    label: "One Takeaway",
    desc: "One key insight to remember from your day",
  },
  {
    key: "statistics",
    label: "Statistics",
    desc: "Lines, commits, files, and most active files",
  },
  {
    key: "paceCheck",
    label: "Pace Check",
    desc: "Compare today's output to your rolling average",
  },
  {
    key: "codebaseHealth",
    label: "Codebase Health",
    desc: "Growth, focus, and churn indicators",
  },
] as const;

const DEFAULT_SECTIONS: Record<string, boolean> = Object.fromEntries(
  SECTION_OPTIONS.map((s) => [s.key, true]),
);

export default function SettingsPage() {
  const router = useRouter();
  const [repos, setRepos] = useState<string[]>([]);
  const [defaultRepo, setDefaultRepo] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [sectionPrefs, setSectionPrefs] = useState<Record<string, boolean>>(DEFAULT_SECTIONS);

  // Fetch repos and current settings
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
        // Silently fail
      }
    })();
  }, []);

  const saveDefaultRepo = useCallback(async (repo: string) => {
    setSaving(true);
    setDefaultRepo(repo);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ default_repo: repo }),
      });
      showMessage("Default repo saved");
    } catch {
      showMessage("Failed to save");
    }
    setSaving(false);
  }, []);

  const deleteRepoHistory = useCallback(async (repo: string) => {
    try {
      await fetch(`/api/account?action=delete-repo-history&repo=${encodeURIComponent(repo)}`, {
        method: "DELETE",
      });
      showMessage(`History cleared for ${repo.split("/").pop()}`);
      setConfirmDelete(null);
    } catch {
      showMessage("Failed to delete");
    }
  }, []);

  const deleteAllHistory = useCallback(async () => {
    try {
      await fetch("/api/account?action=delete-all-history", { method: "DELETE" });
      showMessage("All history cleared");
      setConfirmDelete(null);
    } catch {
      showMessage("Failed to delete");
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    try {
      await fetch("/api/account?action=delete-account", { method: "DELETE" });
      await signOut({ callbackUrl: "/" });
    } catch {
      showMessage("Failed to delete account");
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
        // Revert on failure
        setSectionPrefs((prev) => ({ ...prev, [key]: !enabled }));
      }
    },
    [sectionPrefs],
  );

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <button className="settings-back" onClick={() => router.push("/dashboard")}>
          <ArrowLeft size={16} /> Back to dashboard
        </button>

        <h1 className="settings-title">Settings</h1>

        {message && <div className="settings-message">{message}</div>}

        {/* Default Repo */}
        <div className="settings-section">
          <h2 className="settings-section-title">Default Repository</h2>
          <p className="settings-section-desc">The repo that loads when you open askscout.</p>
          <select
            className="repo-selector settings-select"
            value={defaultRepo}
            onChange={(e) => void saveDefaultRepo(e.target.value)}
            disabled={saving}
          >
            <option value="">Most recently pushed</option>
            {repos.map((repo) => (
              <option key={repo} value={repo}>
                {repo}
              </option>
            ))}
          </select>
        </div>

        {/* Customize Digest */}
        <div className="settings-section">
          <h2 className="settings-section-title">Customize Digest</h2>
          <p className="settings-section-desc">
            Choose which sections appear in your digest. Changes are saved automatically.
          </p>
          <div className="settings-toggles">
            {SECTION_OPTIONS.map((opt) => (
              <label key={opt.key} className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-label">{opt.label}</span>
                  <span className="settings-toggle-desc">{opt.desc}</span>
                </div>
                <input
                  type="checkbox"
                  className="settings-toggle"
                  checked={sectionPrefs[opt.key] !== false}
                  onChange={(e) => void toggleSection(opt.key, e.target.checked)}
                />
              </label>
            ))}
          </div>
        </div>

        {/* Clear History */}
        <div className="settings-section">
          <h2 className="settings-section-title">Clear History</h2>
          <p className="settings-section-desc">Delete past digests. This cannot be undone.</p>
          <div className="settings-actions">
            {repos.slice(0, 10).map((repo) => (
              <div key={repo} className="settings-repo-row">
                <span className="settings-repo-name">{repo}</span>
                {confirmDelete === `repo:${repo}` ? (
                  <div className="settings-confirm">
                    <span>Are you sure?</span>
                    <button
                      className="btn btn-danger-sm"
                      onClick={() => void deleteRepoHistory(repo)}
                    >
                      Yes, delete
                    </button>
                    <button className="btn btn-secondary-sm" onClick={() => setConfirmDelete(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn btn-ghost-sm"
                    onClick={() => setConfirmDelete(`repo:${repo}`)}
                  >
                    <Trash2 size={14} /> Clear
                  </button>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: "var(--space-md)" }}>
            {confirmDelete === "all" ? (
              <div className="settings-confirm">
                <span>Delete ALL history for every repo?</span>
                <button className="btn btn-danger-sm" onClick={() => void deleteAllHistory()}>
                  Yes, delete all
                </button>
                <button className="btn btn-secondary-sm" onClick={() => setConfirmDelete(null)}>
                  Cancel
                </button>
              </div>
            ) : (
              <button className="btn btn-secondary" onClick={() => setConfirmDelete("all")}>
                <Trash2 size={14} /> Clear all history
              </button>
            )}
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="settings-section">
          <h2 className="settings-section-title">Privacy &amp; Security</h2>
          <p className="settings-section-desc">
            Scout is read-only. Here is exactly what we access and what we don&apos;t.
          </p>
          <div className="privacy-grid">
            <div className="privacy-card">
              <div className="privacy-card-title">What Scout reads</div>
              <div className="privacy-card-items">
                <div className="privacy-item privacy-item--safe">Commit messages and metadata</div>
                <div className="privacy-item privacy-item--safe">
                  File diffs (lines added and removed)
                </div>
                <div className="privacy-item privacy-item--safe">File names and paths</div>
              </div>
            </div>
            <div className="privacy-card">
              <div className="privacy-card-title">What Scout never touches</div>
              <div className="privacy-card-items">
                <div className="privacy-item privacy-item--never">
                  Source code (files are never opened)
                </div>
                <div className="privacy-item privacy-item--never">
                  Environment variables and secrets
                </div>
                <div className="privacy-item privacy-item--never">
                  Dependencies and node_modules
                </div>
              </div>
            </div>
          </div>
          <p className="privacy-footer">
            Diffs are processed in memory and discarded. Only the plain-English digest is stored.
            Your code never leaves GitHub.
          </p>
        </div>

        {/* Delete Account */}
        <div className="settings-section settings-danger-zone">
          <h2 className="settings-section-title">
            <AlertTriangle size={16} /> Danger Zone
          </h2>
          <p className="settings-section-desc">
            Permanently delete your account and all associated data. This removes all your digests,
            settings, and disconnects your GitHub account. This cannot be undone.
          </p>
          {confirmDelete === "account" ? (
            <div className="settings-confirm">
              <span>This is permanent. All your data will be deleted.</span>
              <button className="btn btn-danger" onClick={() => void deleteAccount()}>
                Yes, delete my account
              </button>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
            </div>
          ) : (
            <button className="btn btn-danger" onClick={() => setConfirmDelete("account")}>
              Delete account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
