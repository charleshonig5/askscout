import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = {
  title: "The Hidden Cost of Vibe Coding | askscout",
  description:
    "AI coding tools sped us up. They also made it harder to remember what we actually built. Why I think the next big workflow problem is digesting your own code.",
  openGraph: {
    title: "The Hidden Cost of Vibe Coding",
    description:
      "AI coding tools sped us up. They also made it harder to remember what we actually built.",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Hidden Cost of Vibe Coding",
    description:
      "AI coding tools sped us up. They also made it harder to remember what we actually built.",
  },
};

export default function ManifestoPage() {
  return (
    <main className="page">
      <nav className="home-nav" aria-label="Site">
        <Link href="/" className="home-nav-logo">
          askscout
        </Link>
        <div className="home-nav-links">
          <Link href="/articles">Articles</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/privacy">Privacy</Link>
          <ThemeToggle />
        </div>
      </nav>

      <article className="page-body page-body--reading article">
        <Link href="/articles" className="article-back-link">
          ← All articles
        </Link>
        <h1 className="page-title page-title--article">The Hidden Cost of Vibe Coding</h1>
        <p className="article-deck">
          AI coding tools sped us up. They also made it harder to keep track of what we actually
          built. Why I think the next big workflow problem is digesting your own code.
        </p>

        <section className="public-section">
          <p className="public-text">
            Friday, 5&nbsp;PM. You close your laptop. You shipped a lot this week. Two hundred
            commits, a handful of features, a refactor or two. Feels like a productive run.
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
            The way most of us code now is fundamentally different from two years ago. We don&apos;t
            write line by line. We describe what we want, accept the patches, scan the diffs.
            Sometimes we don&apos;t even fully scan the diffs. The friction of producing code has
            basically disappeared.
          </p>
          <p className="public-text">
            What hasn&apos;t disappeared: the cost of remembering what we actually shipped.
          </p>
          <p className="public-text">
            This is what vibe coding looks like in practice. The work feels loose and quick. The
            cost only shows up when you stop typing. That&apos;s when you realize you can&apos;t
            account for half of what you produced.
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
            <strong>Your git log becomes static.</strong> Auto-generated commit messages like{" "}
            <code className="inline-code">wip</code>, <code className="inline-code">fix</code>, and{" "}
            <code className="inline-code">update X</code> don&apos;t tell you what happened. A
            normal week now produces fifty illegible commits per day. You can&apos;t read your own
            history.
          </p>
          <p className="public-text">
            <strong>Monday-morning amnesia.</strong> You sit down to keep building and you
            can&apos;t remember what state the codebase was in when you left Friday. You spend the
            first hour of your week reading your own diffs to onboard yourself.
          </p>
          <p className="public-text">
            <strong>Standup paralysis.</strong> Your team asks what you&apos;ve been working on. You
            actually have to think about it. The honest answer (&ldquo;I don&apos;t really
            remember&rdquo;) feels bad to say, so you make something up.
          </p>
          <p className="public-text">
            <strong>You can&apos;t onboard yourself.</strong> The codebase grew faster than your
            mental model of it. You become a stranger in a project you wrote.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Why current tools don&apos;t fix it</h2>
          <p className="public-text">
            <code className="inline-code">git log</code> is unreadable at this volume. The format
            was designed for slow, deliberate commits. We&apos;re producing fifty a day.
          </p>
          <p className="public-text">
            Linear and Jira track plans. They have no way to see what the AI actually shipped, only
            what you intended to ship. The gap between those two has gotten really wide.
          </p>
          <p className="public-text">
            &ldquo;Just ask the AI to summarize.&rdquo; But the AI doesn&apos;t see your commits.
            You&apos;d have to paste diffs in by hand every day. Nobody does that.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">The thesis</h2>
          <p className="public-text">Vibe coding needs vibe digesting.</p>
          <p className="public-text">
            If AI helped you write the code, AI should help you remember it. A daily summary in
            plain English. Not file paths. Not a reformatted git log. A real read of what happened,
            the way you&apos;d want a coworker to brief you back: Vibe Check, what shipped, what
            changed, what kept shifting, where you left off.
          </p>
          <p className="public-text">
            That&apos;s askscout. Run it as a CLI, or sign in to the web app at{" "}
            <Link href="/">askscout.dev</Link>. It reads your repo, sends only the diffs to the LLM
            you choose, and writes you a digest worth reading. Free. Sets up in about ten seconds.
          </p>
        </section>

        <section className="public-section article-close">
          <p className="public-text">
            <strong>If AI helped you write the code, AI should help you remember it.</strong>
          </p>
        </section>

        <section className="public-section">
          <div className="article-cta">
            <Link href="/" className="btn btn-primary">
              Try askscout
            </Link>
            <Link href="/docs" className="article-cta-secondary">
              Or read the docs →
            </Link>
          </div>
        </section>
      </article>
    </main>
  );
}
