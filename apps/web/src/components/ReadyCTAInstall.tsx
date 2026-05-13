"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Copy-on-click install pill for the reusable Ready CTA section
 * (Figma 244:2673). Same clipboard pattern as <InstallChip /> but
 * styled with the Ready CTA's larger 54-tall pill geometry — 16px
 * text, gap-[14] between text and icon, layered bg-primary surface.
 *
 * The icon flips from Copy → Check for ~1.5s after a successful
 * copy so the click has clear feedback.
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
      className="home-readycta-install"
      onClick={handleClick}
      aria-label="Copy install command to clipboard"
    >
      <span className="home-readycta-install-text">
        <span className="home-readycta-install-prompt">$</span>
        {"  "}npm install -g askscout
      </span>
      {copied ? (
        <Check size={16} strokeWidth={2} aria-hidden />
      ) : (
        <Copy size={16} strokeWidth={1} aria-hidden />
      )}
    </button>
  );
}
