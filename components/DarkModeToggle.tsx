"use client";

import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("cote-theme", next ? "dark" : "light");
    } catch {
      // Stockage indisponible : le réglage ne sera simplement pas mémorisé.
    }
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3.5">
      <span className="text-sm font-bold text-text">Mode sombre</span>
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label="Activer le mode sombre"
        onClick={toggle}
        className="flex h-[26px] w-[46px] flex-shrink-0 items-center rounded-full p-[3px] transition-colors"
        style={{
          background: isDark
            ? "linear-gradient(135deg, var(--color-brand-1), var(--color-brand-2))"
            : "var(--color-border-strong)",
        }}
      >
        <span
          className="block h-5 w-5 rounded-full bg-white shadow transition-transform"
          style={{ transform: isDark ? "translateX(20px)" : "translateX(0)" }}
        />
      </button>
    </div>
  );
}
