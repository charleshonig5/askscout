"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Check, Copy } from "lucide-react";

/** Performs the actual clipboard write + sets the temporary
 *  "copied" UI state. Lives outside the component so the click
 *  handler can stay synchronous (returns void) for ESLint's
 *  no-misused-promises rule. */
async function copyInstallCommand(setCopied: Dispatch<SetStateAction<boolean>>): Promise<void> {
  try {
    await navigator.clipboard.writeText("npm install -g askscout");
    setCopied(true);
    // 1.5s feedback window. Long enough that a user blinking can
    // still catch the state change; short enough that the chip
    // isn't permanently stuck in "copied" if they hover off and
    // come back.
    setTimeout(() => setCopied(false), 1500);
  } catch {
    // Clipboard write can fail in older browsers, sandboxed
    // contexts, or when the page lacks focus. Swallow silently;
    // worst case the user copies the text manually.
  }
}

/**
 * Copy-on-click install command chip used on the marketing home as
 * the secondary CTA. Pattern mirrors what Raycast / Linear / Vercel
 * do on their landing pages: show the install command in a mono
 * pill, click to copy. Power users skip the sign-in path and run
 * the command in their terminal.
 *
 * The icon flips between Copy → Check for ~1.5s after a successful
 * copy so the user sees clear feedback.
 */
export function InstallChip() {
  const [copied, setCopied] = useState(false);

  // Sync wrapper around the async copy so React's onClick gets a
  // void-returning function (some lint rules flag promise-returning
  // handlers). Errors are swallowed inside the async helper.
  const handleClick = () => {
    void copyInstallCommand(setCopied);
  };

  return (
    <button
      type="button"
      className={`home-cta-chip${copied ? " is-copied" : ""}`}
      onClick={handleClick}
      aria-label="Copy install command to clipboard"
    >
      <span className="home-cta-chip-prompt" aria-hidden>
        $
      </span>
      <span className="home-cta-chip-text">npm install -g askscout</span>
      <span className="home-cta-chip-icon" aria-hidden>
        {copied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={1.5} />}
      </span>
    </button>
  );
}
