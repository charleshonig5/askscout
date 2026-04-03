"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Menu, Settings, LogOut } from "lucide-react";
import { RepoSelector } from "./RepoSelector";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  repos: string[];
  selectedRepo: string;
  onRepoChange: (repo: string) => void;
  onMenuToggle: () => void;
}

export function Header({ repos, selectedRepo, onRepoChange, onMenuToggle }: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const avatarUrl = session?.user?.image;
  const userName = session?.user?.name ?? "User";

  return (
    <header className="header">
      <div className="header-left">
        <button className="header-icon-btn sidebar-toggle" onClick={onMenuToggle} aria-label="Menu">
          <Menu size={16} />
        </button>
        <span className="logo">askscout</span>
        <RepoSelector repos={repos} selected={selectedRepo} onChange={onRepoChange} />
      </div>
      <div className="header-right">
        <ThemeToggle />
        <button
          className="header-icon-btn"
          aria-label="Settings"
          onClick={() => router.push("/settings")}
        >
          <Settings size={16} />
        </button>
        <div className="header-separator" />
        <div className="header-profile" ref={menuRef}>
          <button
            className="header-avatar-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Profile menu"
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={userName}
                width={28}
                height={28}
                className="header-avatar-img"
              />
            ) : (
              <div className="header-avatar" />
            )}
          </button>
          {menuOpen && (
            <div className="header-dropdown">
              <div className="header-dropdown-user">
                {avatarUrl && (
                  <Image
                    src={avatarUrl}
                    alt={userName}
                    width={24}
                    height={24}
                    className="header-dropdown-avatar"
                  />
                )}
                <span className="header-dropdown-name">{userName}</span>
              </div>
              <div className="header-dropdown-divider" />
              <button
                className="header-dropdown-item"
                onClick={() => void signOut({ callbackUrl: "/" })}
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
