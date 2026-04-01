"use client";

import { ThemeToggle } from "./ThemeToggle";
import { RepoSelector } from "./RepoSelector";

interface HeaderProps {
  repos: string[];
  selectedRepo: string;
  onRepoChange: (repo: string) => void;
}

export function Header({ repos, selectedRepo, onRepoChange }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        <span className="logo">askscout</span>
        <RepoSelector repos={repos} selected={selectedRepo} onChange={onRepoChange} />
      </div>
      <div className="header-right">
        <ThemeToggle />
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
