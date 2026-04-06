"use client";

import { useState, useCallback } from "react";
import { X, Copy, Check, ClipboardList } from "lucide-react";

interface StandupModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string | null;
}

function FormattedStandup({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i]!.trim();
    if (!trimmed) continue;

    // Section header (Done, Up Next, Heads Up — or legacy Yesterday, Today, Blockers)
    // Also match Slack bold format *Done*, *Up Next*, etc.
    const cleanHeader = trimmed.replace(/^\*|\*$/g, "");
    if (/^(Done|Up Next|Heads Up|Yesterday|Today|Blockers)$/i.test(cleanHeader)) {
      elements.push(
        <div key={i} className="standup-section-title">
          {cleanHeader}
        </div>,
      );
    }
    // Bullet item
    else if (/^[\u2022\-*]/.test(trimmed)) {
      const content = trimmed.replace(/^[\u2022\-*]\s*/, "");
      elements.push(
        <div key={i} className="standup-item">
          {content}
        </div>,
      );
    }
    // Regular text
    else {
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
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">
            <ClipboardList size={16} /> Standup
          </div>
          <button className="header-icon-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <p className="modal-desc">Formatted for Slack. Copy and paste.</p>

        <div className="modal-body">
          {content ? (
            <FormattedStandup text={content} />
          ) : (
            <div className="digest-loading">
              Standup will be ready when the digest finishes generating.
            </div>
          )}
        </div>

        {content && (
          <div className="modal-footer">
            <button
              className={`action-btn modal-copy-btn ${copied ? "copied" : ""}`}
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check size={16} /> Copied
                </>
              ) : (
                <>
                  <Copy size={16} /> Copy to clipboard
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
