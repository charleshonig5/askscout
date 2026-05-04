import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = {
  title: "How to Summarize Your Git Commits (With or Without AI) | AskScout",
  description:
    "Three ways to turn a noisy git log into a readable summary. Manual git commands, your own LLM prompt, or a dedicated tool.",
  openGraph: {
    title: "How to Summarize Your Git Commits (With or Without AI)",
    description:
      "Three ways to turn a noisy git log into a readable summary. Pick by how much friction you can tolerate.",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Summarize Your Git Commits (With or Without AI)",
    description:
      "Three ways to turn a noisy git log into a readable summary.",
  },
};

const FAQ_PLAIN: { q: string; a: string }[] = [
  {
    q: "What is the best git command to see recent commits?",
    a: "git log --since=\"1 day ago\" --oneline shows recent commits as one-line summaries. Add --stat to see file change counts. Add -p to include diffs. These are the building blocks for any summary, manual or automated.",
  },
  {
    q: "Can I use ChatGPT or Claude to summarize my git log?",
    a: "Yes. Run git log --since=\"1 day ago\" --pretty=format:\"%h %s\" --stat, paste the output into ChatGPT or Claude, and ask for a summary by section. The quality depends on your prompt. AskScout automates this exact loop with a tuned prompt and your own API key.",
  },
  {
    q: "What prompt works best for summarizing commits with AI?",
    a: "Ground the model in real diffs, not just commit messages. Ask it to group output by what shipped, what changed, what kept getting reworked, and what was left in progress. Tell it to use plain English and avoid file paths in the summary. That is roughly the prompt the AskScout CLI ships with, ground-tested against thousands of digests.",
  },
  {
    q: "Is there a tool that summarizes commits automatically?",
    a: "AskScout reads your git history and writes a daily digest using your own Anthropic or OpenAI key. It runs as a CLI in any local repo or as a hosted web app on GitHub. No copy-pasting required, no diffs leave your machine except to the LLM provider you chose.",
  },
];

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_PLAIN.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function SummarizeGitCommitsPage() {
  return (
    <main className="page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
      <nav className="home-nav" aria-label="Site">
        <Link href="/" className="home-nav-logo">
          AskScout
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
        <h1 className="page-title page-title--article">
          How to Summarize Your Git Commits (With or Without AI)
        </h1>
        <p className="article-deck">
          Three ways to turn a week of fifty-commits-a-day into something you can actually read.
          The plain command, the do-it-yourself LLM prompt, and the dedicated tool.
        </p>

        <section className="public-section">
          <h2 className="public-section-title">TLDR</h2>
          <p className="public-text">
            You can summarize git commits three ways. The bare minimum is{" "}
            <code className="inline-code">git log --oneline --since</code> to skim. The next step
            up is piping that log into Claude or GPT yourself with a good prompt. The cleanest
            option is a tool that does both for you, like AskScout. Each option below includes
            what to type, what to expect, and when to reach for it.
          </p>
        </section>

        <section className="public-section">
          <p className="public-text">
            A noisy git log is a Friday afternoon problem. You sit down to write a status update
            and your last seven days of work scrolls past as a wall of{" "}
            <code className="inline-code">fix</code>, <code className="inline-code">wip</code>,
            and <code className="inline-code">update X</code>. None of it tells you what
            actually happened.
          </p>
          <p className="public-text">
            That is the gap a summary fills. Below are the three real ways to close it, ordered
            from no-extra-tooling to fully-automated.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Option 1: The plain git command</h2>
          <p className="public-text">
            Before reaching for AI, know your git CLI. The flags are good. Most developers
            forget half of what is already in there.
          </p>
          <p className="public-text">
            For a quick read, this is enough:
          </p>
          <div className="resource-code-block">
            <code>git log --since=&quot;1 day ago&quot; --oneline</code>
          </div>
          <p className="public-text">
            Add <code className="inline-code">--stat</code> to include file change counts:
          </p>
          <div className="resource-code-block">
            <code>git log --since=&quot;1 day ago&quot; --stat</code>
          </div>
          <p className="public-text">
            Use <code className="inline-code">git shortlog</code> to group by author and message:
          </p>
          <div className="resource-code-block">
            <code>git shortlog --since=&quot;1 week ago&quot; --no-merges</code>
          </div>
          <p className="public-text">
            For a denser view that includes diffs, run{" "}
            <code className="inline-code">git log --since=&quot;1 day ago&quot; -p</code>. Be
            warned: at fifty commits a day this is a lot of output.
          </p>
          <p className="public-text">
            What you get: structure and accuracy, no narrative. You still have to read it
            yourself to understand what changed. Use this when the volume is small enough that
            you can.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">
            Option 2: Pipe your log into Claude or GPT yourself
          </h2>
          <p className="public-text">
            Once your week starts producing more commits than you can read, the next move is to
            ask an LLM. You can do this manually with any chat interface.
          </p>
          <p className="public-text">
            The simple version: copy the output of a git command and paste it into Claude or
            ChatGPT.
          </p>
          <div className="resource-code-block">
            <code>{`git log --since="1 day ago" --pretty=format:"%h %s" --stat`}</code>
          </div>
          <p className="public-text">
            Then paste it into the model with a prompt like:
          </p>
          <div className="resource-code-block">
            <code>
              {`Summarize the following git commits into four sections:
- Shipped: things that went from not existing to working
- Changed: things that already existed and got modified
- Still Shifting: areas reworked 3+ times in the window
- Left Off: anything in progress when work stopped

Use plain English. No file paths. 1-2 short sentences per item.

[paste git log output here]`}
            </code>
          </div>
          <p className="public-text">
            What you get: a real narrative, grounded in real commits, in roughly the format
            you&apos;d expect a coworker to give you. Cost runs a few cents at most.
          </p>
          <p className="public-text">
            What you give up: friction. Doing this every day means copy-pasting every day.
            Nobody keeps that habit for long, which is why dedicated tools exist.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Option 3: A dedicated digest tool</h2>
          <p className="public-text">
            If you find yourself doing the manual loop more than twice, automate it.
          </p>
          <p className="public-text">
            AskScout is the version of this loop turned into a CLI. You install once with{" "}
            <code className="inline-code">npm install -g askscout</code>, run{" "}
            <code className="inline-code">askscout --setup</code> with your Anthropic or OpenAI
            key, and after that <code className="inline-code">askscout</code> in any git repo
            prints the same kind of summary you would get from option 2. The prompt is tuned for
            the format. The output is grounded in real diffs.
          </p>
          <p className="public-text">
            The hosted web app is free with a soft cap of 30 digests per day. The CLI is free
            open source software with you bringing your own LLM key (about $0.001 to $0.003 per
            digest). Either way, the diffs go to your provider and nowhere else.
          </p>
          <p className="public-text">
            What you get: the same output as option 2, without the copy-pasting.
          </p>
          <p className="public-text">
            What you give up: the ability to tweak the prompt yourself on every run. AskScout
            ships a fixed prompt with strong constraints. If you want a different voice or
            different sections, the manual prompt route is more flexible.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Picking based on your workflow</h2>
          <p className="public-text">
            If you ship five clean commits a day, just read your git log.
          </p>
          <p className="public-text">
            If you ship fifty commits a day but only summarize once a week, the manual prompt
            route is fine. You can do it on Friday afternoons in five minutes.
          </p>
          <p className="public-text">
            If you ship fifty commits a day and want to actually remember what happened
            yesterday, automate it. The friction of copy-pasting kills the habit faster than
            most people expect.
          </p>
          <p className="public-text">
            The pattern that works for most AI-assisted developers I know: a tool runs the daily
            digest automatically, and the developer reads it. That is the loop that scales.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">FAQ</h2>
          <div className="faq-list">
            {FAQ_PLAIN.map((item) => (
              <div key={item.q} className="faq-item">
                <h3 className="faq-question">{item.q}</h3>
                <p className="public-text">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="public-section">
          <div className="article-cta">
            <Link href="/" className="btn btn-primary">
              Try AskScout
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
