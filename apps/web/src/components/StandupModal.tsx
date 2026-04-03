"use client";

import { useState, useCallback, useEffect } from "react";
import { X, Copy, Check, ClipboardList } from "lucide-react";
import { useDigestStream } from "@/lib/use-digest-stream";

interface StandupModalProps {
  isOpen: boolean;
  onClose: () => void;
  owner: string;
  repo: string;
}

export function StandupModal({ isOpen, onClose, owner, repo }: StandupModalProps) {
  const stream = useDigestStream();
  const [copied, setCopied] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    if (isOpen && !hasGenerated && owner && repo) {
      stream.start(owner, repo, "standup");
      setHasGenerated(true);
    }
  }, [isOpen, owner, repo, hasGenerated, stream]);

  useEffect(() => {
    if (!isOpen) {
      setHasGenerated(false);
      stream.reset();
    }
  }, [isOpen, stream]);

  const handleCopy = useCallback(() => {
    if (!stream.text) return;
    void navigator.clipboard.writeText(stream.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [stream.text]);

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
        <p className="modal-desc">Copy-paste this into Slack or your team standup.</p>

        <div className="modal-body">
          {stream.isStreaming && !stream.text && (
            <div className="digest-loading">Putting together your standup...</div>
          )}
          {stream.isStreaming && stream.text && (
            <div className="ai-context-body">
              {stream.text}
              <span className="streaming-cursor" />
            </div>
          )}
          {!stream.isStreaming && stream.text && (
            <div className="ai-context-body">{stream.text}</div>
          )}
          {stream.error && (
            <div className="digest-error">
              <p>{stream.error}</p>
            </div>
          )}
        </div>

        {stream.text && !stream.isStreaming && (
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
