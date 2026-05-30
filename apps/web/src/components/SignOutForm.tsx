"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Plain HTML form that POSTs directly to Auth.js's `/api/auth/signout`
 * endpoint. This is the ONLY signout flow we've found that actually
 * clears the session cookie reliably in production. Long story:
 *
 *   1. `signOut()` from `next-auth/react` does a fetch + JSON-driven
 *      `window.location.href = data.url`. In our deploy that path was
 *      failing to commit the Set-Cookie before navigation in some
 *      timing window, leaving the user signed in after the redirect.
 *   2. A server-action wrapping the server-side `signOut` from
 *      `@/auth` does soft router navigation via Next.js — but the
 *      router cache held a stale RSC payload for `/` (rendered while
 *      signed in, which itself redirects to `/dashboard`), so the
 *      browser bounced right back into the app.
 *   3. A plain `<form method="POST" action="/api/auth/signout">` gets
 *      a real 302 response from Auth.js with both `Set-Cookie:
 *      authjs.session-token=; Max-Age=0` and `Location: /` headers.
 *      The browser commits the cookie clear and does a hard navigation
 *      in one atomic step. No router cache, no JSON parsing, no
 *      timing window.
 *
 * Auth.js requires a CSRF token for the public signout endpoint. We
 * fetch it on mount (the endpoint is GET, public, no auth needed)
 * and inject it as a hidden field along with the desired callback
 * URL. While the token is loading we render the children with the
 * button disabled — the form simply can't submit yet. This is fine
 * UX-wise because the CSRF fetch takes ~10ms on same origin.
 */
export function SignOutForm({
  callbackUrl = "/",
  children,
  formStyle,
}: {
  /** Where to send the browser after the cookie is cleared. */
  callbackUrl?: string;
  /** Render-prop receives a `disabled` flag while CSRF token is in
   *  flight; the consumer wires it into its submit button so users
   *  don't fire an action-less form. */
  children: (disabled: boolean) => ReactNode;
  /** Optional inline style for the form element, since the form is
   *  typically rendered inside a layout container that wants the form
   *  itself to disappear from layout. */
  formStyle?: React.CSSProperties;
}) {
  const [csrf, setCsrf] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/csrf")
      .then((r) => r.json())
      .then((data: { csrfToken?: string }) => {
        if (!cancelled && data?.csrfToken) setCsrf(data.csrfToken);
      })
      .catch(() => {
        // Network failed — leave button disabled. Better to do
        // nothing than risk an unauthenticated form submission that
        // would just redirect them right back.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <form
      method="POST"
      action="/api/auth/signout"
      style={formStyle ?? { display: "contents" }}
    >
      <input type="hidden" name="csrfToken" value={csrf ?? ""} />
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      {children(csrf === null)}
    </form>
  );
}
