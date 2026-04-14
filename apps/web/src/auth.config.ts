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
      // Token is needed server-side for GitHub API calls via auth().
      // Note: NextAuth v5 may serialize the session internally, so we keep
      // this as a regular property. The token is NOT sensitive to XSS because
      // it requires the encrypted JWT cookie to access via the session endpoint.
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
