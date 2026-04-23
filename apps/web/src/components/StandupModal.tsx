"use client";

import { useState, useCallback } from "react";
import { X, Copy, Check } from "lucide-react";
import { Emoji } from "@/components/Emoji";

interface StandupModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string | null;
}

/**
 * Parses the standup text into sections + bullets. Sections:
 *   - "Done" / "Up Next" / "Heads Up"  (modern)
 *   - "Yesterday" / "Today" / "Blockers"  (legacy — still supported for
 *     stored digests that used the older markers)
 * Slack-bold `*Header*` wrapping is tolerated.
 */
function FormattedStandup({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i]!.trim();
    if (!trimmed) continue;

    const cleanHeader = trimmed.replace(/^\*|\*$/g, "");
    if (/^(Done|Up Next|Heads Up|Yesterday|Today|Blockers)$/i.test(cleanHeader)) {
      elements.push(
        <div key={i} className="standup-section-title">
          {cleanHeader}
        </div>,
      );
    } else if (/^[\u2022\-*]/.test(trimmed)) {
      const content = trimmed.replace(/^[\u2022\-*]\s*/, "");
      elements.push(
        <div key={i} className="standup-item">
          <span className="standup-item-bullet" aria-hidden />
          <p className="standup-item-text">{content}</p>
        </div>,
      );
    } else {
      elements.push(
        <div key={i} className="standup-text">
          {trimmed}
        </div>,
      );
    }
  }

  return <div className="standup-formatted">{elements}</div>;
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
            <X size={20} strokeWidth={1} aria-hidden />
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
