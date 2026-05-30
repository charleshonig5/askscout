/**
 * Resend wrapper for the on-demand "Email me this digest" button.
 *
 * Render path: API route → digestTextToEmailProps() → DigestEmail JSX →
 * @react-email/render → HTML string → Resend `emails.send`. Resend
 * handles transient SMTP failures (rate-limited senders, throttled
 * recipients) internally, so we surface only terminal errors back to
 * the caller as a `{ ok: false }` result rather than throwing.
 *
 * Config:
 *   RESEND_API_KEY  – required. Created in https://resend.com → API Keys.
 *   EMAIL_FROM      – required. RFC 5322 form, e.g.
 *                     "AskScout <digest@askscout.dev>". Must match a
 *                     domain verified in the Resend dashboard.
 *
 * Dev gating: we deliberately refuse to send when running locally
 * (NODE_ENV=development) so iterating on the template does not blast
 * the developer's inbox. Vercel preview deploys (VERCEL_ENV=preview)
 * and production deploys both send for real. The dev-disabled path
 * still renders the HTML so any template regressions surface during
 * `pnpm dev` without the network call.
 */

import { render } from "@react-email/components";
import { Resend } from "resend";
import { DigestEmail, type DigestEmailProps } from "@/emails/DigestEmail";

export type SendDigestResult =
  | { ok: true; id: string }
  | { ok: false; error: string; code: "config" | "dev_disabled" | "provider" };

export interface SendDigestInput {
  /** Verified GitHub primary email pulled from session.user.email. */
  to: string;
  /** Props for the DigestEmail React component. */
  props: DigestEmailProps;
  /** Optional subject override. Defaults to "Your AskScout digest — {repo}". */
  subject?: string;
}

function defaultSubject(props: DigestEmailProps): string {
  return `Your AskScout digest, ${props.repoName}`;
}

export async function sendDigestEmail(input: SendDigestInput): Promise<SendDigestResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return {
      ok: false,
      code: "config",
      error:
        "Email sending is not configured on this deploy (RESEND_API_KEY or EMAIL_FROM missing).",
    };
  }

  // Render first so template errors surface even on dev-disabled runs.
  const html = await render(DigestEmail(input.props));

  // Dev gating — only Vercel preview/production send for real. NODE_ENV
  // is "production" on Vercel preview deploys too, so we use VERCEL_ENV
  // as the deciding signal. Local `pnpm dev` falls into the disabled
  // branch and returns a clear non-error message the API can relay.
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv !== "production" && vercelEnv !== "preview") {
    return {
      ok: false,
      code: "dev_disabled",
      error: "Email sending is disabled in local development.",
    };
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject ?? defaultSubject(input.props),
    html,
  });

  if (error || !data?.id) {
    return {
      ok: false,
      code: "provider",
      error: error?.message ?? "Resend returned an empty response.",
    };
  }

  return { ok: true, id: data.id };
}
