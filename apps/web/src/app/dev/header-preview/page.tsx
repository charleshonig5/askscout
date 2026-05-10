"use client";

import { Header } from "@/components/Header";

export default function HeaderPreview() {
  return (
    <div style={{ background: "var(--color-bg-primary)", minHeight: "100vh" }}>
      <Header onMenuToggle={() => {}} />
    </div>
  );
}
