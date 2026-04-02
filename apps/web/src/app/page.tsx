import { signIn } from "@/auth";
import { MOCK_STREAMING_TEXT } from "@/lib/mock-data";

export default function LandingPage() {
  return (
    <main className="landing">
      <h1 className="landing-title">askscout</h1>
      <p className="landing-subtitle">
        The daily digest for vibe coders. Scout sniffs through your repo and tells you what you
        built, what changed, and where you left off.
      </p>
      <div className="landing-cta">
        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="btn btn-primary"
            style={{ fontSize: 15, padding: "10px 24px" }}
          >
            Sign in with GitHub
          </button>
        </form>
      </div>
      <div className="landing-preview">
        <pre
          className="mono"
          style={{
            fontSize: 12,
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
            color: "var(--color-text-secondary)",
          }}
        >
          {MOCK_STREAMING_TEXT}
        </pre>
      </div>
    </main>
  );
}
