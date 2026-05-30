import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

const authConfig: NextAuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      // `user:email` lets us read the GitHub primary email server-side so
      // the on-demand "Email me this digest" button can deliver to the
      // user's real inbox without us having to ask for a recipient. The
      // scope only grants read access to verified emails; GitHub never
      // exposes the user's email to other users through this scope.
      //
      // NOTE: existing sessions issued before this scope was added will
      // not have `email` populated until the user signs out and back in.
      // The /api/email/digest route returns a clear "re-auth needed"
      // error in that case so the UI can prompt.
      authorization: { params: { scope: "read:user repo user:email" } },
    }),
  ],
  callbacks: {
    jwt({ token, account, profile }) {
      // CRITICAL — pin token.sub to GitHub's stable providerAccountId
      // on every initial sign-in. Without this, NextAuth's JWT
      // strategy issues a fresh UUID for `token.sub` each time a
      // session is created, which means the same GitHub user gets a
      // different `user_id` after each cookie expiry / browser
      // refresh / Vercel redeploy. That orphans every digest the
      // user has ever saved and silently fragments their identity
      // across the database.
      //
      // GitHub's `providerAccountId` is the user's permanent numeric
      // ID (e.g. "42223843") — it never changes for the lifetime of
      // a GitHub account. Pinning to it makes user_id stable across
      // every session forever.
      //
      // The `account` argument is only populated on the initial
      // sign-in event; subsequent JWT refreshes don't see it. So
      // this only runs once per session start, which is all we
      // need — once token.sub is set, NextAuth carries it forward.
      if (account?.providerAccountId) {
        token.sub = account.providerAccountId;
      }
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      // Capture the GitHub username (login) on first sign-in. GitHub's profile
      // payload includes `login` alongside name/email/avatar. Persist it on
      // the JWT so the UI can show the @handle even on subsequent requests
      // when `profile` is undefined.
      if (profile && typeof (profile as { login?: unknown }).login === "string") {
        token.login = (profile as { login: string }).login;
      }
      // Capture the GitHub primary email so the on-demand digest-email
      // route can deliver without asking the user for an address. The
      // OAuth `user:email` scope (declared above) is required for this
      // field to be present in the profile payload.
      if (profile && typeof (profile as { email?: unknown }).email === "string") {
        token.email = (profile as { email: string }).email;
      }
      return token;
    },
    session({ session, token }) {
      // Set stable user ID from JWT subject (always present with GitHub OAuth).
      // Without this, session.user.id is undefined and getUserId() returns null,
      // which causes all API routes to return 401.
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      // Expose GitHub login so the sidebar profile row can show @username.
      if (session.user && typeof token.login === "string") {
        session.user.login = token.login;
      }
      // Surface the GitHub email server-side so /api/email/digest can
      // route the on-demand send. NextAuth already places email on
      // `session.user.email` automatically when present on the token,
      // but the explicit assignment guards against type-narrowing
      // regressions if the upstream callback contract shifts.
      if (session.user && typeof token.email === "string") {
        session.user.email = token.email;
      }
      // Token is needed server-side for GitHub API calls via auth().
      session.accessToken = token.accessToken as string;
      return session;
    },
    authorized({ auth: authSession, request }) {
      const isLoggedIn = !!authSession?.user;
      const path = request.nextUrl.pathname;
      // Keep in sync with middleware.ts matcher.
      const isProtected =
        path.startsWith("/dashboard") ||
        path.startsWith("/settings") ||
        path.startsWith("/insights");
      if (isProtected && !isLoggedIn) return false;
      return true;
    },
  },
  pages: {
    signIn: "/",
  },
};

export default authConfig;
