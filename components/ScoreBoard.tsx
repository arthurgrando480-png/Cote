"use client";

import { useState } from "react";

const SCORES = Array.from({ length: 10 }, (_, i) => i + 1);

export default function ScoreBoard({
  onSelect,
  disabled,
}: {
  onSelect: (score: number) => void;
  disabled?: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  function handleSelect(n: number) {
    if (disabled) return;
    setSelected(n);
    onSelect(n);
  }

  return (
    <div className="flex w-full max-w-[330px] overflow-hidden rounded-full shadow-[0_12px_26px_rgba(0,0,0,.4)]">
      {SCORES.map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => handleSelect(n)}
          aria-label={`Noter ${n} sur 10`}
          className={`brand-gradient flex h-11 min-w-0 flex-1 items-center justify-center border-r border-black/[.18] font-extrabold text-white transition-[filter,transform] duration-150 last:border-r-0 disabled:pointer-events-none disabled:opacity-50 ${
            selected === n ? "z-[2] scale-[1.08] brightness-125" : "hover:brightness-110"
          }`}
          style={{
            textShadow: "0 1px 2px rgba(0,0,0,.35)",
            boxShadow: selected === n ? "inset 0 0 0 2px rgba(255,255,255,.9)" : undefined,
          }}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
