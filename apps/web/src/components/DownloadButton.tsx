"use client";

import { useCallback } from "react";
import { Download } from "lucide-react";

interface DownloadButtonProps {
  text: string;
  filename: string;
}

export function DownloadButton({ text, filename }: DownloadButtonProps) {
  const handleDownload = useCallback(() => {
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [text, filename]);

  return (
    <button className="btn btn-ghost" onClick={handleDownload}>
      <Download size={14} /> Download
    </button>
  );
}
