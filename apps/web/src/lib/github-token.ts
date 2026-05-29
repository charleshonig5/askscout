import { getToken } from "next-auth/jwt";

/**
 * Read the GitHub OAuth access_token from the NextAuth JWT cookie
 * server-side, without putting it on the session object (which would
 * leak it to client-side JS via /api/auth/session).
 *
 * Returns null if the cookie is missing, expired, or doesn't have a
 * token attached — caller should treat that the same as 401.
 *
 * NextAuth v5's getToken accepts any object with a `headers` shape,
 * which lines up with the plain `Request` that App Router route
 * handlers receive. The secret is read from the AUTH_SECRET env
 * (NextAuth's standard convention).
 */
export async function getGithubToken(req: Request): Promise<string | null> {
  // getToken's typed signature wants NextRequest / NextApiRequest, but
  // it also accepts a plain `{ headers }` shape — which plain Request
  // satisfies. No cast needed.
  const token = await getToken({ req: { headers: req.headers } });
  const accessToken = token?.accessToken;
  return typeof accessToken === "string" && accessToken.length > 0
    ? accessToken
    : null;
}
