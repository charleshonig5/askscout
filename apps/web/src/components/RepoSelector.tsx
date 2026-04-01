"use client";

interface RepoSelectorProps {
  repos: string[];
  selected: string;
  onChange: (repo: string) => void;
}

export function RepoSelector({ repos, selected, onChange }: RepoSelectorProps) {
  return (
    <select className="repo-selector" value={selected} onChange={(e) => onChange(e.target.value)}>
      {repos.map((repo) => (
        <option key={repo} value={repo}>
          {repo}
        </option>
      ))}
    </select>
  );
}
