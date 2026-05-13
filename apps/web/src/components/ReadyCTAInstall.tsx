"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Copy-on-click install pill for the reusable Ready CTA section
 * (Figma 244:2673). Same interaction recipe as <InstallChip /> in
 * the hero so the two CTAs read as a pair: icon at size 14 (Copy
 * strokeWidth 1.5 / Check strokeWidth 2), and on successful copy
 * we add an .is-copied class that flips the icon color to
 * --color-success for ~1.5s of feedback before reverting.
 */
export function ReadyCTAInstall() {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    void (async () => {
      try {
        await navigator.clipboard.writeText("npm install -g askscout");
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        // Swallow — clipboard write can fail in old browsers or
        // sandboxed contexts. Worst case, the user reads it.
      }
    })();
  };

  return (
    <button
      type="button"
      className={`home-readycta-install${copied ? " is-copied" : ""}`}
      onClick={handleClick}
      aria-label="Copy install command to clipboard"
    >
      <span className="home-readycta-install-text">
        <span className="home-readycta-install-prompt">$</span>
        {"  "}npm install -g askscout
      </span>
      <span className="home-readycta-install-icon" aria-hidden>
        {copied ? (
          <Check size={14} strokeWidth={2} />
        ) : (
          <Copy size={14} strokeWidth={1.5} />
        )}
      </span>
    </button>
  );
}
