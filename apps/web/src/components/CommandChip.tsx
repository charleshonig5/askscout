"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Check, Copy } from "lucide-react";

/** Generic copy-on-click command chip. Same visual treatment as
 *  InstallChip but takes any shell command as a prop, so docs and
 *  marketing surfaces can reuse the affordance for setup, --week,
 *  --standup, etc. without spinning up a new component each time. */
async function copyCommand(
  command: string,
  setCopied: Dispatch<SetStateAction<boolean>>,
): Promise<void> {
  try {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  } catch {
    // Clipboard write can fail in older browsers, sandboxed
    // contexts, or when the page lacks focus. Fail quietly so the
    // user can copy manually.
  }
}

export function CommandChip({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  const handleClick = () => {
    void copyCommand(command, setCopied);
  };
  return (
    <button
      type="button"
      className={`home-cta-chip${copied ? " is-copied" : ""}`}
      onClick={handleClick}
      aria-label={`Copy ${command} to clipboard`}
    >
      <span className="home-cta-chip-prompt" aria-hidden>
        $
      </span>
      <span className="home-cta-chip-text">{command}</span>
      <span className="home-cta-chip-icon" aria-hidden>
        {copied ? <Check size={16} strokeWidth={2} /> : <Copy size={16} strokeWidth={1.5} />}
      </span>
    </button>
  );
}
