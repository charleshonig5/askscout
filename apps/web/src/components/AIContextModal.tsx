"use client";

import { Fragment, useCallback, useMemo, useState } from "react";
import { CircleX, Copy, Check } from "lucide-react";
import { Emoji } from "@/components/Emoji";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

interface AIContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string | null;
}

type Section =
  | { heading: string; type: "prose"; lines: string[] }
  | { heading: string; type: "list"; items: string[] };

/** The five fixed section headings the resume prompt always uses.
    Defined by the LLM format contract in packages/core/src/summarize.ts. */
const RESUME_HEADINGS = ["Tech Stack", "Recent Work", "Current Focus", "Key Files", "Heads Up"];

/** Sections rendered as bullet lists (one item per line). Everything else
    renders as a prose paragraph. */
const BULLET_HEADINGS = new Set(["Key Files", "Heads Up"]);

/**
 * Parse the LLM-produced resume prompt text into structured sections.
 *
 * Heading-driven, mirroring StandupModal's parseStandup: walk the text
 * line by line, and whenever a line matches one of the known section
 * headings start a new section, accumulating every following line into
 * it until the next heading. Blank lines are ignored.
 *
 * This is deliberately NOT a blank-line block split. The LLM is
 * inconsistent about blank lines - the contract asks for one above each
 * heading, but the model also inserts them between a heading and its
 * body. A block split then strands each heading in its own block and
 * promotes the first line of every paragraph into a fake heading, which
 * renders the whole paragraph at the heavier title weight.
 *
 * The LLM is asked to use the U+2022 bullet char for lists; dashes and
 * asterisks are tolerated defensively.
 */
function parseResumePrompt(text: string): Section[] {
  // Strip a leading non-alphanumeric prefix so an emoji-prefixed
  // heading still matches (warning emojis, variation selectors,
  // whitespace).
  const matchHeading = (line: string): string | null => {
    const cleaned = line.replace(/^[^A-Za-z0-9]+/, "").trim();
    return RESUME_HEADINGS.find((h) => h.toLowerCase() === cleaned.toLowerCase()) ?? null;
  };

  const raw: Array<{ heading: string; lines: string[] }> = [];
  let current: { heading: string; lines: string[] } | null = null;

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const heading = matchHeading(trimmed);
    if (heading) {
      current = { heading, lines: [] };
      raw.push(current);
      continue;
    }
    // Content before the first heading is rare but kept under an empty
    // heading so nothing is silently dropped.
    if (!current) {
      current = { heading: "", lines: [] };
      raw.push(current);
    }
    current.lines.push(trimmed);
  }

  return raw.map((s) => {
    if (BULLET_HEADINGS.has(s.heading)) {
      const items = s.lines.map((l) => l.replace(/^[•\-*]\s*/, "").trim()).filter(Boolean);
      return { heading: s.heading, type: "list", items };
    }
    return { heading: s.heading, type: "prose", lines: s.lines };
  });
}

export function AIContextModal({ isOpen, onClose, content }: AIContextModalProps) {
  const [copied, setCopied] = useState(false);
  // Lock body scroll while the modal is open.
  useBodyScrollLock(isOpen);

  const sections = useMemo(() => (content ? parseResumePrompt(content) : []), [content]);

  /** Build the copy payload from PARSED sections so the formatting
   *  is the same shape the StandupModal copy uses — colon-suffixed
   *  headers, plain `- ` bullets, blank line between sections. The
   *  raw LLM output uses bullet glyphs (•) and bare headings; the
   *  cleaned-up version reads cleaner whether pasted into an AI
   *  coding tool, a doc, or a chat thread. */
  const handleCopy = useCallback(() => {
    if (sections.length === 0) {
      if (!content) return;
      void navigator.clipboard.writeText(content).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
      return;
    }
    const text = sections
      .map((s) => {
        const heading = s.heading ? `${s.heading}:` : "";
        if (s.type === "prose") {
          const body = s.lines.join("\n");
          return heading ? `${heading}\n${body}` : body;
        }
        const items = s.items.map((i) => `- ${i}`).join("\n");
        return heading ? `${heading}\n${items}` : items;
      })
      .filter(Boolean)
      .join("\n\n");
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [content, sections]);

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal modal--resume">
        <div className="modal-top">
          <div className="modal-identity">
            <div className="modal-title-row">
              <Emoji name="resume" size={24} />
              <h2 className="modal-title">AI Resume Prompt</h2>
            </div>
            <p className="modal-subtitle">
              Paste this into your AI coding tool to pick up where you left off.
            </p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            <CircleX size={18} strokeWidth={1} aria-hidden />
          </button>
        </div>

        <div className="modal-divider" aria-hidden />

        <div className="modal-body">
          {!content ? (
            <div className="modal-empty">
              AI Resume Prompt will be ready when the digest finishes generating.
            </div>
          ) : sections.length === 0 ? (
            <div className="resume-fallback">{content}</div>
          ) : (
            <div className="resume-sections">
              {sections.map((s, i) => (
                <Fragment key={`${s.heading}-${i}`}>
                  {s.type === "prose" ? (
                    <div className="resume-section">
                      {s.heading && <div className="resume-section-title">{s.heading}</div>}
                      {s.lines.length > 0 && (
                        <div className="resume-section-list">
                          {s.lines.map((line, j) => (
                            <p key={j} className="resume-section-body">
                              {line}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="resume-section">
                      {s.heading && <div className="resume-section-title">{s.heading}</div>}
                      {s.items.length > 0 && (
                        <div className="resume-section-list">
                          {s.items.map((item, j) => (
                            <div key={j} className="resume-item">
                              <span className="resume-item-bullet" aria-hidden />
                              <p className="resume-item-text">{item}</p>
                            </div>
                          ))}
                        </div>
                      )}
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
                  <Check size={18} strokeWidth={1} aria-hidden />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={18} strokeWidth={1} aria-hidden />
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
