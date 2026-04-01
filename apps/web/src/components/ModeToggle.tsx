"use client";

type Mode = "digest" | "resume" | "standup";

interface ModeToggleProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const modes: { value: Mode; label: string }[] = [
    { value: "digest", label: "Digest" },
    { value: "resume", label: "Resume" },
    { value: "standup", label: "Standup" },
  ];

  return (
    <div className="mode-toggle">
      {modes.map((m) => (
        <button
          key={m.value}
          className={`mode-toggle-btn ${mode === m.value ? "active" : ""}`}
          onClick={() => onChange(m.value)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
