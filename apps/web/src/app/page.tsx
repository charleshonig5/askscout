import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signIn } from "@/auth";
import { MOCK_STREAMING_TEXT } from "@/lib/mock-data";

export default async function LandingPage() {
  const session = await auth();

  // If already logged in, go straight to dashboard
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="landing">
      <nav className="landing-nav">
        <Link href="/articles">Articles</Link>
        <Link href="/docs">Docs</Link>
        <Link href="/privacy">Privacy</Link>
      </nav>
      <h1 className="landing-title">askscout</h1>
      <p className="landing-tagline">The daily digest for vibe coders.</p>
      <p className="landing-subtitle">
        You ship 200 commits a week with your AI coding tools. By Friday you can&apos;t remember
        what you actually built. askscout reads your git history and tells you, in plain English,
        what shipped, what changed, and where you left off.
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
        <p className="landing-security">
          Read-only. askscout reads your commit history and diffs. Never your source code, never
          your secrets.
        </p>
        <p className="landing-manifesto-link">
          <Link href="/articles/the-hidden-cost-of-vibe-coding">
            Read: The hidden cost of vibe coding →
          </Link>
        </p>
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
