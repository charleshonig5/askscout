"use client";

import { useState, useCallback } from "react";

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button className={`btn btn-ghost ${copied ? "copied" : ""}`} onClick={handleCopy}>
      {copied ? "\u2713 Copied" : "Copy"}
    </button>
  );
}
