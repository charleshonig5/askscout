import Link from "next/link";

export const metadata = {
  title: "The Hidden Cost of Vibe Coding | askscout",
  description:
    "AI coding tools made us faster. They also made it harder to remember what we actually built. The case for a daily digest in the vibe-coding era.",
  openGraph: {
    title: "The Hidden Cost of Vibe Coding",
    description:
      "AI coding tools made us faster. They also made it harder to remember what we actually built.",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Hidden Cost of Vibe Coding",
    description:
      "AI coding tools made us faster. They also made it harder to remember what we actually built.",
  },
};

export default function ManifestoPage() {
  return (
    <main className="public-page">
      <nav className="public-nav">
        <Link href="/" className="public-nav-logo">
          askscout
        </Link>
        <div className="public-nav-links">
          <Link href="/manifesto">Manifesto</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
      </nav>

      <article className="public-content manifesto">
        <h1 className="public-title">The Hidden Cost of Vibe Coding</h1>
        <p className="manifesto-deck">
          AI coding tools made us faster. They also made it harder to remember what we actually
          built. Here&apos;s the case for a daily digest in the vibe-coding era.
        </p>

        <section className="public-section">
          <p className="public-text">
            Friday, 5&nbsp;PM. You close your laptop. You shipped a lot this week — 200+ commits, a
            handful of features, a refactor or two. You can feel the velocity in your bones.
          </p>
          <p className="public-text">
            Then your teammate asks: <em>&ldquo;What did you build this week?&rdquo;</em>
          </p>
          <p className="public-text">
            You stare at them. You pause for a second too long. Your brain is empty.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">A new pattern, a new problem</h2>
          <p className="public-text">
            AI coding tools didn&apos;t just speed us up. They changed our relationship with our own
            code. We don&apos;t write line-by-line anymore. We describe outcomes, accept patches,
            review diffs at speed. The cost of getting code into the codebase has collapsed.
          </p>
          <p className="public-text">
            What hasn&apos;t collapsed: the cost of remembering what we actually shipped.
          </p>
          <p className="public-text">
            This is the shape of vibe coding. Fluid, fast, generative. And it has a hidden cost
            nobody talks about — because the cost only shows up when you stop typing.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">The hidden costs</h2>
          <p className="public-text">
            <strong>Mental ownership erodes.</strong> When you didn&apos;t type the bytes, they
            don&apos;t live in your head the same way. You know the AI built a feature. You
            don&apos;t fully remember what&apos;s in it.
          </p>
          <p className="public-text">
            <strong>Your git log becomes static.</strong> Auto-generated commit messages —
            <code className="inline-code">wip</code>, <code className="inline-code">fix</code>,{" "}
            <code className="inline-code">update X</code> — don&apos;t tell you what happened. A
            normal week now produces 50 illegible commits per day. The signal-to-noise ratio of your
            history is on the floor.
          </p>
          <p className="public-text">
            <strong>Monday-morning amnesia.</strong> You sit down to keep building and you
            can&apos;t remember what state the codebase was in when you left Friday. You spend the
            first hour of your week reading your own diffs to onboard yourself.
          </p>
          <p className="public-text">
            <strong>Standup paralysis.</strong> Your team asks what you&apos;ve been working on. You
            actually have to think about it. The honest answer — &ldquo;I don&apos;t really
            remember&rdquo; — feels bad to say, so you make something up.
          </p>
          <p className="public-text">
            <strong>You can&apos;t onboard yourself.</strong> The codebase grew faster than your
            mental model of it. You become a stranger in a project you wrote.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Why current tools don&apos;t fix it</h2>
          <p className="public-text">
            <code className="inline-code">git log</code> is unreadable at this volume. The whole
            format was designed for an era of slower, more deliberate commits. It scales linearly;
            our output has gone exponential.
          </p>
          <p className="public-text">
            Project trackers like Linear and Jira track <em>plans</em>, not actual{" "}
            <em>built work</em>. The disconnect between what you intended and what the AI actually
            shipped is now significant — and the trackers can&apos;t see the difference.
          </p>
          <p className="public-text">
            &ldquo;Just ask the AI to summarize&rdquo; — but the AI doesn&apos;t see your commits.
            You&apos;d have to paste in diffs every day. Nobody does that.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">The thesis</h2>
          <p className="public-text">Vibe coding needs vibe digesting.</p>
          <p className="public-text">
            If AI helped you write the code, AI should help you remember it. A daily summary, in
            plain English, of what your AI-assisted self actually shipped. Not a list of file paths.
            Not a reformatted git log. A read of the day, the way a thoughtful engineer would write
            it up — Vibe Check, what shipped, what changed, what kept shifting, where you left off.
          </p>
          <p className="public-text">
            That&apos;s askscout. Run it as a CLI in your repo, or sign in to the web app at{" "}
            <Link href="/">askscout.dev</Link>. It reads your git history, sends only the diffs to
            the LLM of your choice, and gives you back a digest you&apos;d actually want to read.
            Free. Takes ten seconds to install.
          </p>
        </section>

        <section className="public-section manifesto-close">
          <p className="public-text">
            <strong>If AI helped you write the code, AI should help you remember it.</strong>
          </p>
        </section>

        <section className="public-section">
          <div className="manifesto-cta">
            <Link href="/" className="btn btn-primary">
              Try askscout
            </Link>
            <Link href="/docs" className="manifesto-cta-secondary">
              Or read the docs →
            </Link>
          </div>
        </section>
      </article>
    </main>
  );
}
