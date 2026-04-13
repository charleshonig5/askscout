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
      // Make accessToken non-enumerable so it's available server-side via auth()
      // but NOT serialized to JSON for the browser session endpoint.
      // Server: auth() returns the object in memory — property is accessible.
      // Client: /api/auth/session serializes to JSON — non-enumerable = stripped.
      Object.defineProperty(session, "accessToken", {
        value: token.accessToken as string,
        enumerable: false,
        writable: false,
      });
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
