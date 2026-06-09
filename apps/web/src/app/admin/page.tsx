import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";

/* /admin — single-operator dashboard for the askScout deployment.
 *
 * Auth model
 * ----------
 * Gated by NextAuth session AND a strict env-var check:
 *   session.user.id === process.env.ADMIN_USER_ID
 *
 * Anyone failing the check (signed out, signed in as someone else, or
 * the env var not configured) gets notFound() so the route is
 * indistinguishable from a non-existent page. No "access denied", no
 * redirect to sign-in, no information leak about the route existing.
 *
 * The env var ADMIN_USER_ID is the GitHub providerAccountId (a stable
 * numeric string like "42223843"), pinned into token.sub on first
 * sign-in by auth.config.ts. See the JWT callback comment there for
 * why we pin to providerAccountId and not a UUID.
 *
 * Data sources
 * ------------
 * - Supabase (web app metrics): we don't use Supabase Auth, so "users"
 *   is implicitly distinct user_id values across the digests + checkins
 *   tables. Queries are read-only and tolerate missing tables gracefully.
 * - npm registry (CLI download counts): public stats only. The CLI
 *   itself ships zero telemetry by design, per the README's privacy
 *   contract — we never break that promise from the admin side either.
 * - GitHub (repo activity): public stats only. */

export const metadata: Metadata = {
  title: "Admin · askScout",
  description: "Operator dashboard.",
  robots: { index: false, follow: false },
};

/* Server-side cache duration in seconds. Hitting refresh in the
 * browser too often shouldn't hammer Supabase / npm / GitHub. The
 * dashboard's manual refresh button busts this by appending a
 * cache-busting search param to the route. */
const CACHE_SECONDS = 60;

// -- Supabase queries ------------------------------------------------

interface WebMetrics {
  /** Distinct user_id values across digests + user_settings + daily_checkins.
   *  This is the broadest "have done something" definition we can build
   *  from the schema. It still misses users who signed in but never took
   *  a tracked action — NextAuth is JWT-only and doesn't write on
   *  sign-in, so "browse-only" sessions are invisible at this layer.
   *  For raw page-view / session counts, check Vercel Analytics. */
  activeUsers: number;
  /** Subset of activeUsers who have generated at least one digest.
   *  The gap (activeUsers - digestGenerators) is users who signed in
   *  and changed a setting or landed on a quiet-day but never generated
   *  a digest. */
  digestGenerators: number;
  digestsTotal: number;
  digestsToday: number;
  digestsThisWeek: number;
  digestsThisMonth: number;
  emailsSent: number;
  topRepos: { repo: string; digests: number }[];
  /** Users whose FIRST activity (across all three tables) was within
   *  the last 7 days. Approximates "new signups this week," with the
   *  same caveat about browse-only sessions being invisible. */
  newActiveUsersThisWeek: number;
}

async function getWebMetrics(): Promise<WebMetrics | null> {
  if (!supabase) return null;

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    digestsCount,
    digestsToday,
    digestsWeek,
    digestsMonth,
    digestUsersResp,
    settingsUsersResp,
    checkinUsersResp,
    emailedResp,
    topReposResp,
  ] = await Promise.all([
    supabase.from("digests").select("*", { count: "exact", head: true }),
    supabase.from("digests").select("*", { count: "exact", head: true }).gte("created_at", dayAgo),
    supabase.from("digests").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    supabase
      .from("digests")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthAgo),
    supabase.from("digests").select("user_id, created_at"),
    // user_settings rows only get created when a user actively changes
    // a setting (toggle a section, pin a default repo). updated_at is
    // the closest "first seen via this table" proxy we have.
    supabase.from("user_settings").select("user_id, updated_at"),
    supabase.from("daily_checkins").select("user_id, checkin_date"),
    supabase
      .from("digests")
      .select("*", { count: "exact", head: true })
      .not("last_emailed_at", "is", null),
    supabase.from("digests").select("repo"),
  ]);

  // Build a unified "first seen" map across all three user-attributed
  // tables. A user's first activity = earliest timestamp from any of
  // (digest created, settings updated, checkin recorded). This is the
  // best honest signal of "this person did something."
  const userFirstSeen = new Map<string, string>();
  const update = (uid: string | undefined, ts: string | undefined): void => {
    if (!uid || !ts) return;
    const prev = userFirstSeen.get(uid);
    if (!prev || ts < prev) userFirstSeen.set(uid, ts);
  };

  // Track which users have generated a digest specifically — used for
  // the "digest generators" subset metric.
  const digestUserIds = new Set<string>();

  for (const row of digestUsersResp.data ?? []) {
    const r = row as { user_id?: string; created_at?: string };
    update(r.user_id, r.created_at);
    if (r.user_id) digestUserIds.add(r.user_id);
  }
  for (const row of settingsUsersResp.data ?? []) {
    const r = row as { user_id?: string; updated_at?: string };
    update(r.user_id, r.updated_at);
  }
  for (const row of checkinUsersResp.data ?? []) {
    const r = row as { user_id?: string; checkin_date?: string };
    update(r.user_id, r.checkin_date);
  }

  const activeUsers = userFirstSeen.size;
  const digestGenerators = digestUserIds.size;
  const newActiveUsersThisWeek = Array.from(userFirstSeen.values()).filter(
    (d) => d >= weekAgo,
  ).length;

  // Build top repos by digest count (top 5).
  const repoCounts = new Map<string, number>();
  for (const row of topReposResp.data ?? []) {
    const repo = (row as { repo?: string }).repo;
    if (!repo) continue;
    repoCounts.set(repo, (repoCounts.get(repo) ?? 0) + 1);
  }
  const topRepos = Array.from(repoCounts.entries())
    .map(([repo, digests]) => ({ repo, digests }))
    .sort((a, b) => b.digests - a.digests)
    .slice(0, 5);

  return {
    activeUsers,
    digestGenerators,
    digestsTotal: digestsCount.count ?? 0,
    digestsToday: digestsToday.count ?? 0,
    digestsThisWeek: digestsWeek.count ?? 0,
    digestsThisMonth: digestsMonth.count ?? 0,
    emailsSent: emailedResp.count ?? 0,
    topRepos,
    newActiveUsersThisWeek,
  };
}

// -- npm + GitHub (public) -------------------------------------------

interface CliMetrics {
  downloadsLastDay: number;
  downloadsLastWeek: number;
  downloadsLastMonth: number;
  latestVersion: string;
}

async function getCliMetrics(): Promise<CliMetrics | null> {
  try {
    const [day, week, month, registry] = await Promise.all([
      fetch("https://api.npmjs.org/downloads/point/last-day/askscout", {
        next: { revalidate: CACHE_SECONDS },
      }),
      fetch("https://api.npmjs.org/downloads/point/last-week/askscout", {
        next: { revalidate: CACHE_SECONDS },
      }),
      fetch("https://api.npmjs.org/downloads/point/last-month/askscout", {
        next: { revalidate: CACHE_SECONDS },
      }),
      fetch("https://registry.npmjs.org/askscout/latest", {
        next: { revalidate: CACHE_SECONDS },
      }),
    ]);
    const [dayJson, weekJson, monthJson, registryJson] = (await Promise.all([
      day.json(),
      week.json(),
      month.json(),
      registry.json(),
    ])) as [
      { downloads: number },
      { downloads: number },
      { downloads: number },
      { version: string },
    ];
    return {
      downloadsLastDay: dayJson.downloads ?? 0,
      downloadsLastWeek: weekJson.downloads ?? 0,
      downloadsLastMonth: monthJson.downloads ?? 0,
      latestVersion: registryJson.version ?? "unknown",
    };
  } catch {
    return null;
  }
}

interface GithubMetrics {
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
}

async function getGithubMetrics(): Promise<GithubMetrics | null> {
  try {
    const res = await fetch("https://api.github.com/repos/charleshonig5/askscout", {
      next: { revalidate: CACHE_SECONDS },
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      stargazers_count: number;
      forks_count: number;
      open_issues_count: number;
      subscribers_count: number;
    };
    return {
      stars: json.stargazers_count ?? 0,
      forks: json.forks_count ?? 0,
      openIssues: json.open_issues_count ?? 0,
      watchers: json.subscribers_count ?? 0,
    };
  } catch {
    return null;
  }
}

// -- Page ------------------------------------------------------------

export default async function AdminPage() {
  // Single auth gate: NextAuth session must be the configured admin
  // user. Runs BEFORE any data fetch so a non-admin never causes
  // Supabase / npm / GitHub network calls. notFound() so the route
  // 404s identically to any nonexistent path, never leaking that
  // /admin exists to non-admins.
  const session = await auth();
  const adminUserId = process.env.ADMIN_USER_ID;
  if (!session?.user?.id || !adminUserId || session.user.id !== adminUserId) {
    notFound();
  }

  const [web, cli, gh] = await Promise.all([getWebMetrics(), getCliMetrics(), getGithubMetrics()]);

  return (
    <main className="settings-page">
      <div className="settings-card">
        <header className="settings-header">
          <Link href="/dashboard" className="settings-header-back">
            <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="settings-header-title">Admin</h1>
          <Link
            href="/admin?refresh=1"
            className="settings-header-back"
            aria-label="Refresh"
            title="Refresh data"
          >
            <RefreshCw size={16} strokeWidth={1.5} aria-hidden />
            <span>Refresh</span>
          </Link>
        </header>

        <div className="settings-divider" />

        <div className="settings-content">
          {/* WEB APP METRICS */}
          <section className="settings-section">
            <div className="settings-section-head">
              <div className="settings-section-text">
                <h2 className="settings-section-title">Web app</h2>
                <p className="settings-section-desc">
                  Active users = distinct user_id values across digests, settings, and check-ins.
                  Browse-only sessions are invisible here because NextAuth is JWT-only and
                  doesn&apos;t write on sign-in. For raw page views and sessions, check Vercel
                  Analytics — those numbers will always be higher than the count below.
                </p>
              </div>
            </div>
            {web === null ? (
              <p className="admin-empty">Supabase not configured.</p>
            ) : (
              <div className="admin-grid">
                <MetricCard
                  label="Active users"
                  value={web.activeUsers.toLocaleString()}
                  sub={`+${web.newActiveUsersThisWeek} this week`}
                />
                <MetricCard
                  label="Digest generators"
                  value={web.digestGenerators.toLocaleString()}
                  sub={
                    web.activeUsers > web.digestGenerators
                      ? `${web.activeUsers - web.digestGenerators} active but never generated`
                      : "all active users have generated"
                  }
                />
                <MetricCard label="Digests today" value={web.digestsToday.toLocaleString()} />
                <MetricCard
                  label="Digests this week"
                  value={web.digestsThisWeek.toLocaleString()}
                />
                <MetricCard
                  label="Digests this month"
                  value={web.digestsThisMonth.toLocaleString()}
                />
                <MetricCard
                  label="Digests (lifetime)"
                  value={web.digestsTotal.toLocaleString()}
                />
                <MetricCard
                  label="Emails sent"
                  value={web.emailsSent.toLocaleString()}
                  sub="manual send button"
                />
              </div>
            )}
          </section>

          <div className="settings-divider" />

          {/* TOP REPOS */}
          <section className="settings-section">
            <div className="settings-section-head">
              <div className="settings-section-text">
                <h2 className="settings-section-title">Top repos</h2>
                <p className="settings-section-desc">By total digest count, all time.</p>
              </div>
            </div>
            {!web || web.topRepos.length === 0 ? (
              <p className="admin-empty">No digests yet.</p>
            ) : (
              <ul className="admin-toprepos">
                {web.topRepos.map((r) => (
                  <li key={r.repo} className="admin-toprepos-row">
                    <span className="admin-toprepos-repo">{r.repo}</span>
                    <span className="admin-toprepos-count">{r.digests}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="settings-divider" />

          {/* CLI METRICS — public only */}
          <section className="settings-section">
            <div className="settings-section-head">
              <div className="settings-section-text">
                <h2 className="settings-section-title">CLI</h2>
                <p className="settings-section-desc">
                  Public stats only. The CLI ships zero telemetry by design — we don&apos;t track
                  active users or digests generated locally, and we never will without explicit
                  opt-in.
                </p>
              </div>
            </div>
            {cli === null ? (
              <p className="admin-empty">npm API unreachable.</p>
            ) : (
              <div className="admin-grid">
                <MetricCard label="Downloads (day)" value={cli.downloadsLastDay.toLocaleString()} />
                <MetricCard
                  label="Downloads (week)"
                  value={cli.downloadsLastWeek.toLocaleString()}
                />
                <MetricCard
                  label="Downloads (month)"
                  value={cli.downloadsLastMonth.toLocaleString()}
                />
                <MetricCard label="Latest version" value={cli.latestVersion} />
              </div>
            )}
          </section>

          <div className="settings-divider" />

          {/* GITHUB METRICS */}
          <section className="settings-section">
            <div className="settings-section-head">
              <div className="settings-section-text">
                <h2 className="settings-section-title">GitHub</h2>
                <p className="settings-section-desc">Repo activity from the public API.</p>
              </div>
            </div>
            {gh === null ? (
              <p className="admin-empty">GitHub API unreachable.</p>
            ) : (
              <div className="admin-grid">
                <MetricCard label="Stars" value={gh.stars.toLocaleString()} />
                <MetricCard label="Forks" value={gh.forks.toLocaleString()} />
                <MetricCard label="Open issues" value={gh.openIssues.toLocaleString()} />
                <MetricCard label="Watchers" value={gh.watchers.toLocaleString()} />
              </div>
            )}
          </section>

          <div className="settings-divider" />

          <p className="admin-footnote">
            Data cached server-side for {CACHE_SECONDS} seconds. Click Refresh above to force a
            re-fetch.
          </p>
        </div>
      </div>
    </main>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="admin-metric">
      <p className="admin-metric-label">{label}</p>
      <p className="admin-metric-value">{value}</p>
      {sub && <p className="admin-metric-sub">{sub}</p>}
    </div>
  );
}
