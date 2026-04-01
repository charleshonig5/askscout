"use client";

import { CopyButton } from "./CopyButton";
import { DownloadButton } from "./DownloadButton";
import { EmailButton } from "./EmailButton";

interface ExportActionsProps {
  text: string;
  filename: string;
}

export function ExportActions({ text, filename }: ExportActionsProps) {
  return (
    <div className="export-actions">
      <CopyButton text={text} />
      <DownloadButton text={text} filename={filename} />
      <EmailButton />
    </div>
  );
}
