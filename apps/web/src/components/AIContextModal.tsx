"use client";

import { Fragment, useCallback, useMemo, useState } from "react";
import { CircleX, Copy, Check } from "lucide-react";
import { Emoji } from "@/components/Emoji";

interface AIContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string | null;
}

type Section =
  | { heading: string; type: "prose"; body: string }
  | { heading: string; type: "list"; items: string[] };

/** Sections rendered as bullet lists (one item per line). Everything else
    renders as a prose paragraph. Matches the LLM format contract in
    packages/core/src/summarize.ts (Tech Stack / Recent Work / Current
    Focus = prose; Key Files / Heads Up = bullets). */
const BULLET_HEADINGS = new Set(["Key Files", "Heads Up"]);

/**
 * Parse the LLM-produced resume prompt text into structured sections.
 * Blocks are separated by blank lines. First non-empty line in a block
 * is the heading; remaining lines are either a prose body (joined with
 * spaces) or bullet items depending on whether the heading is in
 * BULLET_HEADINGS.
 *
 * The LLM output is required to use the • (U+2022) bullet char for
 * lists; dashes and asterisks are also tolerated defensively.
 */
function parseResumePrompt(text: string): Section[] {
  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const sections: Section[] = [];
  for (const block of blocks) {
    const rawLines = block.split("\n");
    // Strip any leading warning sign / emoji from the heading so
    // "⚠️ Heads Up" still matches "Heads Up". The regex eats
    // emoji-adjacent invisible codepoints (FE0F variation selector)
    // and whitespace.
    const heading = (rawLines[0] ?? "")
      .replace(/^[\u2600-\u27BF\uFE0F\u{1F300}-\u{1FAFF}\s]+/u, "")
      .trim();
    const rest = rawLines.slice(1);

    if (BULLET_HEADINGS.has(heading)) {
      const items = rest
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => l.replace(/^[\u2022\-*]\s*/, ""));
      sections.push({ heading, type: "list", items });
    } else {
      const body = rest
        .map((l) => l.trim())
        .filter(Boolean)
        .join(" ");
      sections.push({ heading, type: "prose", body });
    }
  }
  return sections;
}

export function AIContextModal({ isOpen, onClose, content }: AIContextModalProps) {
  const [copied, setCopied] = useState(false);

  const sections = useMemo(() => (content ? parseResumePrompt(content) : []), [content]);

  const handleCopy = useCallback(() => {
    if (!content) return;
    void navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [content]);

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal modal--resume">
        <div className="modal-top">
          <div className="modal-identity">
            <div className="modal-title-row">
              <Emoji name="resume" size={24} />
              <h2 className="modal-title">Resume Prompt</h2>
            </div>
            <p className="modal-subtitle">
              Paste this into your AI coding tool to pick up where you left off.
            </p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            <CircleX size={20} strokeWidth={1} aria-hidden />
          </button>
        </div>

        <div className="modal-divider" aria-hidden />

        <div className="modal-body">
          {!content ? (
            <div className="modal-empty">
              Resume Prompt will be ready when the digest finishes generating.
            </div>
          ) : sections.length === 0 ? (
            <div className="resume-fallback">{content}</div>
          ) : (
            <div className="resume-sections">
              {sections.map((s, i) => (
                <Fragment key={`${s.heading}-${i}`}>
                  {s.type === "prose" ? (
                    <div className="resume-section">
                      <div className="resume-section-title">{s.heading}</div>
                      <p className="resume-section-body">{s.body}</p>
                    </div>
                  ) : (
                    <div className="resume-section">
                      <div className="resume-section-title">{s.heading}</div>
                      <div className="resume-section-list">
                        {s.items.map((item, j) => (
                          <div key={j} className="resume-item">
                            <span className="resume-item-bullet" aria-hidden />
                            <p className="resume-item-text">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          )}
        </div>

        {content && (
          <div className="modal-footer">
            <button
              type="button"
              className={`modal-copy-btn${copied ? " is-copied" : ""}`}
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check size={20} strokeWidth={1} aria-hidden />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={20} strokeWidth={1} aria-hidden />
                  Copy to Clipboard
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
