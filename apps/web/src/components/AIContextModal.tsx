"use client";

import { useState, useCallback } from "react";
import { X, Copy, Check, Sparkles } from "lucide-react";

interface AIContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string | null;
}

export function AIContextModal({ isOpen, onClose, content }: AIContextModalProps) {
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
            <Sparkles size={16} /> AI Context
          </div>
          <button className="header-icon-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <p className="modal-desc">
          Paste this into your AI coding tool to pick up where you left off.
        </p>

        <div className="modal-body">
          {content ? (
            <div className="ai-context-body">{content}</div>
          ) : (
            <div className="digest-loading">
              AI context will be ready when the digest finishes generating.
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
