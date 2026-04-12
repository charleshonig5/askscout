"use client";

import { useState, useCallback } from "react";
import { X, Copy, Check, ListChecks } from "lucide-react";

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string | null;
}

function FormattedPlan({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i]!.trim();
    if (!trimmed) continue;

    // Checkbox item: - [ ] task (reason)
    if (/^-\s*\[[ x]?\]/.test(trimmed)) {
      const content = trimmed.replace(/^-\s*\[[ x]?\]\s*/, "");
      // Split task from parenthetical reason
      const parenIdx = content.lastIndexOf("(");
      if (parenIdx > 0) {
        const task = content.slice(0, parenIdx).trim();
        const reason = content.slice(parenIdx);
        elements.push(
          <div key={i} className="plan-item">
            <span className="plan-checkbox" />
            <span className="plan-task">{task}</span>
            <span className="plan-reason">{reason}</span>
          </div>,
        );
      } else {
        elements.push(
          <div key={i} className="plan-item">
            <span className="plan-checkbox" />
            <span className="plan-task">{content}</span>
          </div>,
        );
      }
    }
    // Regular text
    else {
      elements.push(
        <div key={i} className="plan-text">
          {trimmed}
        </div>,
      );
    }
  }

  return <div className="plan-formatted">{elements}</div>;
}

export function PlanModal({ isOpen, onClose, content }: PlanModalProps) {
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
            <ListChecks size={16} /> Today&apos;s Plan
          </div>
          <button className="header-icon-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <p className="modal-desc">
          Scout&apos;s suggested priorities based on what&apos;s open. Copy into your project
          tracker.
        </p>

        <div className="modal-body">
          {content ? (
            <FormattedPlan text={content} />
          ) : (
            <div className="digest-loading">
              Plan will be ready when the digest finishes generating.
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
