"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { X, Copy, Check, ListChecks } from "lucide-react";

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

/**
 * Parse the LLM-produced plan into a structured task list. Supports:
 *  - New format: "- [ ] Task sentence. Reason sentence." (split on first ". ")
 *  - Old format (backward compat): "- [ ] Task (reason)" (trailing parens)
 *  - Bare: "- [ ] Task with no reason"
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
        const reason = content.slice(parenIdx + 1, -1).trim();
        tasks.push({ id: task, task, reason });
        continue;
      }
    }

    // New format: split on first ". " (period + space), keep period on task
    const periodIdx = content.indexOf(". ");
    if (periodIdx > 0 && periodIdx < content.length - 2) {
      const task = content.slice(0, periodIdx + 1).trim();
      const reason = content.slice(periodIdx + 2).trim();
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
        // Persist immediately so state survives modal close / page refresh.
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
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">
            <ListChecks size={16} /> To-Do List
            {tasks.length > 0 && (
              <span className="plan-progress">
                {doneCount} / {tasks.length}
              </span>
            )}
          </div>
          <button className="header-icon-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <p className="modal-desc">Your to-do list for today. Check off as you go.</p>

        <div className="modal-body">
          {!content ? (
            <div className="digest-loading">
              Your to-do list will be ready when the digest finishes generating.
            </div>
          ) : tasks.length === 0 ? (
            <div className="digest-loading">No tasks yet.</div>
          ) : (
            <div className="plan-formatted">
              {tasks.map((t) => {
                const isChecked = !!checked[t.id];
                return (
                  <div key={t.id} className={`plan-item${isChecked ? " plan-item--checked" : ""}`}>
                    <button
                      type="button"
                      className={`plan-checkbox${isChecked ? " plan-checkbox--checked" : ""}`}
                      onClick={() => toggleChecked(t.id)}
                      aria-label={isChecked ? "Mark as not done" : "Mark as done"}
                      aria-pressed={isChecked}
                    >
                      {isChecked && <Check size={12} strokeWidth={3} />}
                    </button>
                    <div className="plan-item-body">
                      <span className="plan-task">{t.task}</span>
                      {t.reason && <span className="plan-reason">{t.reason}</span>}
                    </div>
                  </div>
                );
              })}
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
