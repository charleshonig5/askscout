"use client";

/**
 * Internal staging preview for the Toast component.
 *
 * Auth-free route so we can verify the toast renders correctly in
 * both dark and light mode without having to spin up an authenticated
 * settings session and force a real API failure. Trigger buttons
 * fire the same exact copy the production settings page uses, so
 * what you see here is what users see when something actually breaks.
 *
 * Reachable on the deployed site for visual iteration. Once the toast
 * pattern is settled, this route can be deleted or moved behind auth.
 */

import { useToast } from "@/components/Toast";

export default function ToastPreviewPage() {
  const { showError } = useToast();

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-bg-secondary)",
        color: "var(--color-text-primary)",
        fontFamily: "var(--font-sans)",
        padding: "48px 24px",
      }}
    >
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        <header style={{ marginBottom: "24px" }}>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 600 }}>
            Toast preview
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: "14px",
              lineHeight: "1.5",
              color: "var(--color-text-secondary)",
            }}
          >
            Click a button below to fire the exact toast users see in
            production when each Settings action fails. Toasts auto-dismiss
            after 4 seconds; click them to dismiss manually. Switch the app
            theme to verify dark/light rendering.
          </p>
        </header>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            padding: "20px",
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
          }}
        >
          <DemoRow
            label="Default repo save fails"
            onClick={() =>
              showError(
                "Couldn't save default repo",
                "Check your connection and try again.",
              )
            }
          />
          <DemoRow
            label="Per-repo Clear fails"
            onClick={() =>
              showError(
                "Couldn't clear charleshonig5/askscout",
                "The history is still intact. Please try again.",
              )
            }
          />
          <DemoRow
            label="Section toggle fails"
            onClick={() =>
              showError(
                "Couldn't save section preference",
                "Try again in a moment.",
              )
            }
          />
          <DemoRow
            label="Title only (no description)"
            onClick={() => showError("Something went wrong")}
          />
          <DemoRow
            label="Long copy (wrap test)"
            onClick={() =>
              showError(
                "Couldn't reach the server right now",
                "We retried twice. The save didn't go through. If this keeps happening, refresh the page or check status.askscout.dev for incidents.",
              )
            }
          />
          <DemoRow
            label="Fire 3 in a row (stack test)"
            onClick={() => {
              showError("First error", "Stack test #1");
              setTimeout(
                () => showError("Second error", "Stack test #2"),
                150,
              );
              setTimeout(
                () => showError("Third error", "Stack test #3"),
                300,
              );
            }}
          />
        </div>
      </div>
    </main>
  );
}

function DemoRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: "left",
        padding: "10px 14px",
        background: "var(--color-bg-primary)",
        border: "1px solid var(--color-border)",
        borderRadius: "6px",
        color: "var(--color-text-primary)",
        fontFamily: "var(--font-sans)",
        fontSize: "13px",
        fontWeight: 400,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
