"use client";

import { useState } from "react";
import DeletePhotoButton from "./DeletePhotoButton";

export type GridPhoto = {
  id: string;
  url: string;
  storagePath: string;
  createdAt: string;
  moderationStatus: "pending" | "approved" | "rejected";
  score: number | null;
  votes: number;
};

export default function ProfileGrid({
  photos,
  editable,
}: {
  photos: GridPhoto[];
  editable: boolean;
}) {
  const [sortMode, setSortMode] = useState<"recent" | "top">("recent");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [detail, setDetail] = useState<GridPhoto | null>(null);

  function selectSort(mode: "recent" | "top") {
    if (mode === sortMode) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortMode(mode);
      setSortDir("desc");
    }
  }

  if (photos.length === 0) {
    return (
      <p className="px-5 text-text-muted">
        {editable
          ? "Tu n'as pas encore publié de photo. Rends-toi sur « Publier » pour ajouter la première."
          : "Aucune photo publiée pour l'instant."}
      </p>
    );
  }

  const sorted = [...photos].sort((a, b) => {
    let diff: number;
    if (sortMode === "recent") {
      diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      diff = (b.score ?? -1) - (a.score ?? -1);
    }
    return sortDir === "desc" ? diff : -diff;
  });

  return (
    <>
      <div className="flex gap-2 overflow-x-auto px-5">
        {(["recent", "top"] as const).map((mode) => {
          const active = sortMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => selectSort(mode)}
              className={`flex-shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
                active
                  ? "brand-gradient border-transparent text-white"
                  : "border-border-strong bg-bg text-text-muted hover:border-text-faint hover:text-text"
              }`}
            >
              {mode === "recent" ? "Récentes" : "Mieux notées"}
              {active && <span className="text-[11px]"> {sortDir === "desc" ? "↓" : "↑"}</span>}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-[2px]">
        {sorted.map((photo) => (
          <div key={photo.id} className="relative aspect-[3/4] overflow-hidden bg-bg-page">
            <button
              type="button"
              className="h-full w-full cursor-pointer"
              onClick={() => setDetail(photo)}
              aria-label="Voir la photo en grand"
            >
              <img src={photo.url} alt="" className="h-full w-full object-cover" />
            </button>
            {photo.moderationStatus === "pending" && (
              <span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-full bg-black/55 px-2 py-[3px] text-[11px] font-extrabold text-white backdrop-blur-sm">
                En modération
              </span>
            )}
            {photo.moderationStatus === "rejected" && (
              <span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-full bg-red-500/80 px-2 py-[3px] text-[11px] font-extrabold text-white backdrop-blur-sm">
                Refusée
              </span>
            )}
            {photo.moderationStatus === "approved" && (
              <span className="pointer-events-none absolute bottom-1.5 left-1.5 flex items-baseline gap-1 rounded-full bg-black/55 px-2 py-[3px] text-[11px] font-extrabold text-white backdrop-blur-sm [font-variant-numeric:tabular-nums]">
                {photo.score !== null ? photo.score.toFixed(1) : "—"}
                {photo.votes > 0 && (
                  <span className="text-[9px] font-semibold opacity-80">· {photo.votes}</span>
                )}
              </span>
            )}
            {editable && (
              <DeletePhotoButton photoId={photo.id} storagePath={photo.storagePath} />
            )}
          </div>
        ))}
      </div>

      {detail && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-bg">
          <div className="flex justify-end p-3.5">
            <button
              type="button"
              onClick={() => setDetail(null)}
              aria-label="Fermer"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-page text-text-muted"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center overflow-hidden px-5">
            <img src={detail.url} alt="" className="max-h-full max-w-full rounded-2xl object-contain shadow-lg" />
          </div>
          <div className="px-6 pb-8 pt-2 text-center">
            <div className="text-[42px] font-extrabold tracking-tight [font-variant-numeric:tabular-nums]">
              {detail.score !== null ? (
                <>
                  {detail.score.toFixed(1)}
                  <span className="text-lg font-bold text-text-faint">/10</span>
                </>
              ) : (
                "—"
              )}
            </div>
            <div className="mt-0.5 text-[13px] font-semibold text-text-muted">
              {detail.score !== null
                ? `${detail.votes} vote${detail.votes > 1 ? "s" : ""}`
                : "En attente de votes"}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
