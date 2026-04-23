"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { CircleX, Copy, Check } from "lucide-react";
import { Emoji } from "@/components/Emoji";

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string | null;
}

interface Task {
  id: string;
  task: string;
  reason: string | null;
}

/** Capitalize the first character so reason fragments render as proper sentences. */
function sentenceCase(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Parse the LLM-produced plan into a structured task list. Supports:
 *  - New format: "- [ ] Task sentence. Reason sentence." (split on first ". ")
 *  - Old format (backward compat): "- [ ] Task (reason)" (trailing parens)
 *  - Bare: "- [ ] Task with no reason"
 *
 * Reasons always get forced into sentence case — the old parenthetical format
 * produced lowercase fragments like "blocks the checkout flow" which render
 * wrong on their own. New prompts already produce proper sentences, so the
 * transform is a no-op there.
 */
function parseTasks(text: string): Task[] {
  const tasks: Task[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!/^-\s*\[[ x]?\]/.test(trimmed)) continue;
    const content = trimmed.replace(/^-\s*\[[ x]?\]\s*/, "").trim();
    if (!content) continue;

    // Old format: trailing parens → treat as reason
    if (content.endsWith(")")) {
      const parenIdx = content.lastIndexOf("(");
      if (parenIdx > 0) {
        const task = content.slice(0, parenIdx).trim();
        const reason = sentenceCase(content.slice(parenIdx + 1, -1).trim());
        tasks.push({ id: task, task, reason });
        continue;
      }
    }

    // New format: split on first ". " (period + space), keep period on task
    const periodIdx = content.indexOf(". ");
    if (periodIdx > 0 && periodIdx < content.length - 2) {
      const task = content.slice(0, periodIdx + 1).trim();
      const reason = sentenceCase(content.slice(periodIdx + 2).trim());
      tasks.push({ id: task, task, reason });
      continue;
    }

    // Bare task, no reason
    tasks.push({ id: content, task: content, reason: null });
  }
  return tasks;
}

/** Stable hash for localStorage keys. Just a quick djb2-ish accumulator. */
function hashString(s: string): string {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

export function PlanModal({ isOpen, onClose, content }: PlanModalProps) {
  const [copied, setCopied] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const tasks = useMemo(() => (content ? parseTasks(content) : []), [content]);

  // Storage key is derived from the content itself so regeneration with the
  // same task list preserves check state, but different plans start fresh.
  const storageKey = useMemo(
    () => (content ? `askscout:todos:${hashString(content)}` : null),
    [content],
  );

  // Load persisted check state on open / when the plan changes.
  useEffect(() => {
    if (!storageKey) {
      setChecked({});
      return;
    }
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
      if (saved) {
        setChecked(JSON.parse(saved) as Record<string, boolean>);
      } else {
        setChecked({});
      }
    } catch {
      setChecked({});
    }
  }, [storageKey]);

  const toggleChecked = useCallback(
    (id: string) => {
      setChecked((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        if (storageKey && typeof window !== "undefined") {
          try {
            localStorage.setItem(storageKey, JSON.stringify(next));
          } catch {
            // Storage failures are silent — checked state stays session-only.
          }
        }
        return next;
      });
    },
    [storageKey],
  );

  const handleCopy = useCallback(() => {
    if (!content) return;
    void navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [content]);

  if (!isOpen) return null;

  const doneCount = tasks.filter((t) => checked[t.id]).length;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal modal--plan">
        <div className="modal-top">
          <div className="modal-identity">
            <div className="modal-title-row">
              <Emoji name="plan" size={24} />
              <h2 className="modal-title">To-Do List</h2>
              {tasks.length > 0 && (
                <span className="modal-progress-pill">
                  {doneCount}/{tasks.length}
                </span>
              )}
            </div>
            <p className="modal-subtitle">Your to-do list for today. Check off as you go.</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            <CircleX size={20} strokeWidth={1} aria-hidden />
          </button>
        </div>

        <div className="modal-divider" aria-hidden />

        <div className="modal-body">
          {!content ? (
            <div className="modal-empty">
              Your to-do list will be ready when the digest finishes generating.
            </div>
          ) : tasks.length === 0 ? (
            <div className="modal-empty">No tasks yet.</div>
          ) : (
            <div className="plan-list">
              {tasks.map((t, i) => {
                const isChecked = !!checked[t.id];
                return (
                  <Fragment key={t.id}>
                    <div className={`plan-item${isChecked ? " plan-item--checked" : ""}`}>
                      <button
                        type="button"
                        className={`plan-checkbox${isChecked ? " plan-checkbox--checked" : ""}`}
                        onClick={() => toggleChecked(t.id)}
                        aria-label={isChecked ? "Mark as not done" : "Mark as done"}
                        aria-pressed={isChecked}
                      >
                        {isChecked && <Check size={14} strokeWidth={2} aria-hidden />}
                      </button>
                      <div className="plan-item-body">
                        <span className="plan-task">{t.task}</span>
                        {t.reason && <span className="plan-reason">{t.reason}</span>}
                      </div>
                    </div>
                    {i < tasks.length - 1 && <div className="plan-item-divider" aria-hidden />}
                  </Fragment>
                );
              })}
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
