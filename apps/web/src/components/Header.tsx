"use client";

import { Menu, Settings } from "lucide-react";
import { RepoSelector } from "./RepoSelector";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  repos: string[];
  selectedRepo: string;
  onRepoChange: (repo: string) => void;
  onMenuToggle: () => void;
}

export function Header({ repos, selectedRepo, onRepoChange, onMenuToggle }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        <button className="btn btn-ghost sidebar-toggle" onClick={onMenuToggle} aria-label="Menu">
          <Menu size={16} />
        </button>
        <span className="logo">askscout</span>
        <RepoSelector repos={repos} selected={selectedRepo} onChange={onRepoChange} />
      </div>
      <div className="header-right">
        <ThemeToggle />
        <button className="btn btn-ghost" aria-label="Settings">
          <Settings size={16} />
        </button>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "var(--radius-full)",
            background: "var(--color-bg-tertiary)",
          }}
        />
      </div>
    </header>
  );
}
