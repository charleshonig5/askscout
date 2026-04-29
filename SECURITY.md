# Security policy

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

If you've found a security issue in askscout, report it privately so we can coordinate a fix before disclosure.

### How to report

Email **charleshonigdesign@gmail.com** with:

- A description of the vulnerability
- Steps to reproduce, including sample input or code if relevant
- The version of askscout (CLI or web) where you observed it
- Any suggested mitigation, if you have one
- Whether you'd like to be credited in the disclosure

You can also use [GitHub's private vulnerability reporting](https://github.com/charleshonig5/askscout/security/advisories/new) if you prefer — same channel reaches the maintainer.

### What to expect

- **Acknowledgement** within 72 hours
- **Initial triage** within 7 days — confirming whether it's a vulnerability and the severity
- **Fix timeline** depends on severity:
  - Critical (RCE, credential exposure, data leakage): aim for a patched release within 7 days
  - High (auth bypass, escalation): within 14 days
  - Medium / Low: rolled into the next regular release
- **Public disclosure** happens after a patched release is available. We'll credit you in the release notes if you opt in.

## Supported versions

Only the latest minor release of `askscout` (CLI) and `@askscout/core` is actively patched. Older versions may receive critical security fixes at the maintainer's discretion.

| Package          | Latest       | Security fixes |
| ---------------- | ------------ | -------------- |
| `askscout` (CLI) | latest minor | ✅             |
| `@askscout/core` | latest minor | ✅             |

The web app at askscout.dev is always running the latest deployed version — there's no concept of an "older release" to patch.

## Scope

In scope:

- The `askscout` CLI (`packages/cli/`)
- The `@askscout/core` library (`packages/core/`)
- The askscout.dev web app (`apps/web/`)

Out of scope:

- Vulnerabilities in third-party dependencies — please report those upstream. We'll bump the affected dependency once a patch is available
- Issues that require physical access to a user's machine
- Social engineering, phishing, or attacks against the maintainer's accounts
- Denial-of-service attacks against the web app's hosted infrastructure (report to the relevant cloud provider)

## Hardening notes (for users)

- The CLI sends git diffs to your chosen LLM provider (Anthropic or OpenAI). Treat that as you would any code-sharing tool: don't run askscout on repos containing secrets you wouldn't paste into an LLM
- API keys are stored in `~/.askscout/config.json` with file mode 0600. Don't commit this file or share screenshots of it
- The web app uses GitHub OAuth for auth. Revoke access at any time via [GitHub's authorized OAuth apps page](https://github.com/settings/applications)

## Thank you

Responsible disclosure makes the project safer for everyone. We appreciate your work.
