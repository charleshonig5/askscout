import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      /** GitHub username (login). Captured from the OAuth profile so the UI
       *  can display the @handle distinctly from the full display name. */
      login?: string;
    };
    /* SECURITY: `accessToken` is intentionally NOT declared on Session.
     * NextAuth serves the session via /api/auth/session, so anything on
     * it is reachable from any client-side script. The GitHub OAuth
     * access_token lives only on the JWT (below) and is read server-side
     * via getToken({ req }) from "next-auth/jwt" inside the two API
     * routes that need to call the GitHub API.
     */
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    /** GitHub OAuth access_token. Server-only — never expose to client. */
    accessToken?: string;
    login?: string;
  }
}
