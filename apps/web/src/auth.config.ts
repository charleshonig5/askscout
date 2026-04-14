import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

const authConfig: NextAuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: { params: { scope: "read:user repo" } },
    }),
  ],
  callbacks: {
    jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
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
      // Token is needed server-side for GitHub API calls via auth().
      session.accessToken = token.accessToken as string;
      return session;
    },
    authorized({ auth: authSession, request }) {
      const isLoggedIn = !!authSession?.user;
      const path = request.nextUrl.pathname;
      const isProtected = path.startsWith("/dashboard") || path.startsWith("/settings");
      if (isProtected && !isLoggedIn) return false;
      return true;
    },
  },
  pages: {
    signIn: "/",
  },
};

export default authConfig;
