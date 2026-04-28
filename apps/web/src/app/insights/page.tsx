"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleX } from "lucide-react";
import { Emoji } from "@/components/Emoji";

/**
 * Insights page (`/insights`).
 *
 * Sibling of `/settings` — reuses the same shell primitives
 * (`.settings-page`, `.settings-card`, `.settings-header`,
 * `.settings-content`, `.settings-section`, etc.) so both pages share
 * the same card-on-page rhythm without inventing a new layout system.
 *
 * Page contents are built section by section per the plan in
 * `ACTIVITY_DASHBOARD_PLAN.md`. This file holds the shell + section
 * scaffolding; each section's real content lands incrementally.
 */
interface InsightsData {
  bestStreak: { length: number; repo: string | null };
  totalDigests: number;
}

const EMPTY_DATA: InsightsData = {
  bestStreak: { length: 0, repo: null },
  totalDigests: 0,
};

export default function InsightsPage() {
  const router = useRouter();
  const [data, setData] = useState<InsightsData>(EMPTY_DATA);
  const [loaded, setLoaded] = useState(false);

  // Fetch insights data. The endpoint returns the same shape as
  // EMPTY_DATA so we always have valid state, even on a fresh
  // account with zero activity.
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/insights");
        if (res.ok) {
          const json = (await res.json()) as InsightsData;
          setData(json);
        }
      } catch {
        /* silent — leave EMPTY_DATA in place */
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const goBack = () => router.push("/dashboard");

  return (
    <div className="settings-page">
      <div className="settings-card">
        {/* Header strip — mirrors settings/page.tsx exactly so the two
            sibling pages share the same arrival feel. */}
        <div className="settings-header">
          <div className="settings-header-left">
            <button type="button" className="settings-back-pill" onClick={goBack}>
              <ArrowLeft size={10} strokeWidth={1} aria-hidden />
              Back to Digest
            </button>
            <h1 className="settings-title">Insights</h1>
          </div>
          <button
            type="button"
            className="settings-close-btn"
            onClick={goBack}
            aria-label="Close insights"
          >
            <CircleX size={20} strokeWidth={1} aria-hidden />
            <span>Close</span>
          </button>
        </div>
        <hr className="settings-header-divider" />

        <div className="settings-content">
          {/* SNAPSHOT — two top-tier stats per the plan: best streak
              (with the repo it was achieved on) and total digests.
              Section is gated on `loaded` so users with real data
              don't see a brief flash of zeros before their numbers
              come in. Once loaded, zeros are themselves the valid
              empty state for fresh accounts. */}
          {loaded && (
            <section className="settings-section">
              <header className="settings-section-head">
                <div className="settings-section-title">
                  <Emoji name="snapshot" size={20} />
                  <h2>Snapshot</h2>
                </div>
                <p className="settings-section-desc">A quick look at your time with Scout.</p>
              </header>
              <div className="settings-panel insights-snapshot">
                <div className="insights-stat-cell">
                  <span className="insights-stat-label">Best streak</span>
                  <div className="insights-stat-value-row">
                    <span className="insights-stat-value">{data.bestStreak.length}</span>
                    <span className="insights-stat-unit">
                      {data.bestStreak.length === 1 ? "day" : "days"}
                    </span>
                  </div>
                  {/* Repo line only renders once the user has at least
                      one streak; on a fresh account it stays out of
                      the way. */}
                  {data.bestStreak.repo && (
                    <span className="insights-stat-detail">on {data.bestStreak.repo}</span>
                  )}
                </div>
                <div className="insights-stat-cell">
                  <span className="insights-stat-label">Total digests</span>
                  <div className="insights-stat-value-row">
                    <span className="insights-stat-value">{data.totalDigests}</span>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
