"use client";

import { useEffect } from "react";

/**
 * Dashboard-scoped error boundary. Next.js mounts this when any client
 * component below `/dashboard` throws during render or commit. Without
 * it the whole app shows the generic "Application error" white-screen.
 *
 * The most common trigger is a stale stats blob in the history sidebar
 * — an older stored digest missing a nested field that newer code
 * accesses. The reset button re-renders the page tree, which usually
 * pulls fresh data and recovers.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof console !== "undefined") {
      console.error("[dashboard] render error:", error);
    }
  }, [error]);

  return (
    <div className="dashboard-error-boundary">
      <h2>Something glitched.</h2>
      <p>
        Scout hit an unexpected error rendering this view. Reload to recover — if it keeps
        happening, mention the digest hash below.
      </p>
      {error.digest && <p className="dashboard-error-boundary-digest">{error.digest}</p>}
      <button type="button" className="btn btn-secondary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
