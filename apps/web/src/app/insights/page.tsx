"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleX } from "lucide-react";

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
          {/* Sections land here, one at a time, per the plan doc. The
              empty/loading state is intentional: each section will
              render its own zeros / placeholder when data is missing,
              not a global skeleton. */}
          {loaded && (
            <>
              {/* Phase 1 placeholder — sections fill in subsequent
                  phases. Render nothing visible while we scaffold. */}
              <p className="settings-section-desc" style={{ visibility: "hidden" }}>
                Stats: {data.totalDigests} digest(s), best streak {data.bestStreak.length} days.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
