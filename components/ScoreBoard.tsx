"use client";

import { useState } from "react";
import Image from "next/image";

const SCORES = Array.from({ length: 10 }, (_, i) => i + 1);

// Astuce : le parent doit rendre ce composant avec key={photo.id} pour que
// l'affichage revienne automatiquement au choix Noter/Passer à chaque nouvelle photo.
export default function ScoreBoard({
  onSelect,
  onSkip,
  disabled,
}: {
  onSelect: (score: number) => void;
  onSkip: () => void;
  disabled?: boolean;
}) {
  const [showScores, setShowScores] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  function handleSelect(n: number) {
    if (disabled) return;
    setSelected(n);
    onSelect(n);
  }

  return (
    <div className="flex flex-col items-center gap-2.5">
      {!showScores ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setShowScores(true)}
            className="rounded-full px-[13px] py-1.5 text-xs font-bold text-white shadow-[0_4px_10px_-2px_rgba(15,174,107,.4)] disabled:opacity-40"
            style={{ backgroundImage: "linear-gradient(135deg, #1fd1b8, #0fae6b)" }}
          >
            Noter
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onSkip}
            className="rounded-full border border-white/45 bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md transition-colors hover:bg-white/25 disabled:opacity-40"
          >
            Passer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-[7px]">
          {SCORES.map((n) => (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => handleSelect(n)}
              aria-label={`Noter ${n} sur 10`}
              className={`relative h-10 w-[31px] transition-transform disabled:pointer-events-none disabled:opacity-50 ${
                selected === n ? "-translate-y-1 scale-[1.18]" : "hover:-translate-y-[3px] hover:scale-105"
              }`}
            >
              <Image src={`/orbs/ball-${n}.png`} alt={String(n)} fill sizes="31px" className="object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
