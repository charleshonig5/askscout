"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Inline command row used in the docs CLI command reference list.
 *
 * Visually a plain text row — `$  command` with a copy icon to
 * the right — without the bordered/filled pill that CommandChip
 * provides. The pill is reserved for the prominent Install /
 * Setup / Run "do this now" cards above; the reference rows are
 * lower-emphasis so each command reads as a list item.
 *
 * Click anywhere on the row to copy the command. Icon flips to
 * Check for ~1.5s on success.
 */
export function DocsCliCmdInline({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    void (async () => {
      try {
        await navigator.clipboard.writeText(command);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        // Clipboard write can fail in sandboxed contexts. Fail
        // quietly so the user can copy manually.
      }
    })();
  };

  return (
    <button
      type="button"
      className={`docs-cli-cmd-inline${copied ? " is-copied" : ""}`}
      onClick={handleClick}
      aria-label={`Copy ${command} to clipboard`}
    >
      <span className="docs-cli-cmd-inline-prompt" aria-hidden>
        $
      </span>
      <span className="docs-cli-cmd-inline-text">{command}</span>
      <span className="docs-cli-cmd-inline-icon" aria-hidden>
        {copied ? (
          <Check size={16} strokeWidth={2} />
        ) : (
          <Copy size={16} strokeWidth={1.5} />
        )}
      </span>
    </button>
  );
}
