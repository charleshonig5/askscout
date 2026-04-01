"use client";

import { useState, useCallback } from "react";

export function EmailButton() {
  const [sent, setSent] = useState(false);

  const handleEmail = useCallback(() => {
    // TODO: wire up Resend API call
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }, []);

  return (
    <button className={`btn btn-ghost ${sent ? "copied" : ""}`} onClick={handleEmail}>
      {sent ? "\u2713 Sent" : "\u2709 Email"}
    </button>
  );
}
