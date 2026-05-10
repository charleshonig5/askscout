"use client";

import { Copy, Download, Mail, Forward } from "lucide-react";
import { Header } from "@/components/Header";
import { Emoji } from "@/components/Emoji";

/**
 * Visual sandbox for the mobile dashboard rebuild. Renders the chrome
 * header plus static markup for each section we've shipped so far,
 * styled by globals.css so we can compare against the Figma frames at
 * 402px viewport without going through auth.
 *
 * Sections implemented:
 *   1. Chrome header (Figma 287:3361)
 *   2. Digest page header (Figma 289:7288)
 */
export default function HeaderPreview() {
  return (
    <div style={{ background: "var(--color-bg-primary)", minHeight: "100vh" }}>
      <Header onMenuToggle={() => {}} />

      <div className="digest-container">
        <div className="digest-page-header">
          <div className="digest-page-header-left">
            <h1 className="digest-page-name">
              <span className="digest-page-title-text">Today&rsquo;s Digest</span>
              <span className="digest-page-pills">
                <a
                  href="https://github.com/charleshonig5/askscout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="digest-repo-chip"
                >
                  askscout
                  <Forward size={10} strokeWidth={1} aria-hidden />
                </a>
                <span className="digest-streak">
                  <Emoji name="streak" size={14} /> 7 Day Streak
                </span>
              </span>
            </h1>
            <p className="digest-page-date">Thursday, April 16, 2026</p>
          </div>
          <div className="digest-page-header-right">
            <div className="digest-actions-row">
              <button type="button" className="action-btn">
                <Copy size={18} strokeWidth={1} aria-hidden />
                Copy
              </button>
              <button type="button" className="action-btn">
                <Download size={18} strokeWidth={1} aria-hidden />
                Download
              </button>
              <button type="button" className="action-btn">
                <Mail size={18} strokeWidth={1} aria-hidden />
                Email
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
