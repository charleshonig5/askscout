"use client";

import { useState, useCallback } from "react";
import { CircleX, Copy, Check } from "lucide-react";
import { Emoji } from "@/components/Emoji";

interface StandupModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string | null;
}

/**
 * Parses the standup text into structured sections + bullets. Sections:
 *   - "Done" / "Up Next" / "Heads Up"  (modern)
 *   - "Yesterday" / "Today" / "Blockers"  (legacy — still supported for
 *     stored digests that used the older markers)
 * Slack-bold `*Header*` wrapping is tolerated.
 *
 * Each section is rendered as a nested flex column so the title → first
 * item gap and the item → item gap both stay 8px per Figma, while the
 * section → section gap sits at 24px on the outer wrapper.
 */
interface StandupSection {
  heading: string;
  items: Array<{ bullet: boolean; text: string }>;
}

function parseStandup(text: string): StandupSection[] {
  const sections: StandupSection[] = [];
  let current: StandupSection | null = null;

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const cleanHeader = trimmed.replace(/^\*|\*$/g, "");
    if (/^(Done|Up Next|Heads Up|Yesterday|Today|Blockers)$/i.test(cleanHeader)) {
      current = { heading: cleanHeader, items: [] };
      sections.push(current);
      continue;
    }

    // Anything before the first heading gets grouped under an empty
    // section so it still renders. Rare — the LLM always starts with
    // a heading — but defends against malformed content.
    if (!current) {
      current = { heading: "", items: [] };
      sections.push(current);
    }

    if (/^[\u2022\-*]/.test(trimmed)) {
      current.items.push({ bullet: true, text: trimmed.replace(/^[\u2022\-*]\s*/, "") });
    } else {
      current.items.push({ bullet: false, text: trimmed });
    }
  }

  return sections;
}

function FormattedStandup({ text }: { text: string }) {
  const sections = parseStandup(text);
  return (
    <div className="standup-formatted">
      {sections.map((s, i) => (
        <div key={i} className="standup-section">
          {s.heading && <div className="standup-section-title">{s.heading}</div>}
          {s.items.map((item, j) =>
            item.bullet ? (
              <div key={j} className="standup-item">
                <span className="standup-item-bullet" aria-hidden />
                <p className="standup-item-text">{item.text}</p>
              </div>
            ) : (
              <div key={j} className="standup-text">
                {item.text}
              </div>
            ),
          )}
        </div>
      ))}
    </div>
  );
}

export function StandupModal({ isOpen, onClose, content }: StandupModalProps) {
  const [copied, setCopied] = useState(false);

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
      <div className="modal modal--standup">
        <div className="modal-top">
          <div className="modal-identity">
            <div className="modal-title-row">
              <Emoji name="standup" size={24} />
              <h2 className="modal-title">Generate Standup</h2>
            </div>
            <p className="modal-subtitle">Formatted for Slack and Teams. Just copy and paste.</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            <CircleX size={20} strokeWidth={1} aria-hidden />
          </button>
        </div>

        <div className="modal-divider" aria-hidden />

        <div className="modal-body">
          {content ? (
            <FormattedStandup text={content} />
          ) : (
            <div className="modal-empty">
              Standup will be ready when the digest finishes generating.
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
