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
  distribution: number[]; // longueur 10 : distribution[0] = nb de votes "1", ... distribution[9] = nb de votes "10"
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
  const [showStats, setShowStats] = useState(false);

  function selectSort(mode: "recent" | "top") {
    if (mode === sortMode) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortMode(mode);
      setSortDir("desc");
    }
  }

  function openDetail(photo: GridPhoto) {
    setDetail(photo);
    setShowStats(false);
  }

  function closeDetail() {
    setDetail(null);
    setShowStats(false);
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

  const maxCount = detail ? Math.max(1, ...detail.distribution) : 1;

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
              onClick={() => openDetail(photo)}
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
              <span className="pointer-events-none absolute bottom-1.5 left-1.5 flex items-baseline gap-1 rounded-full bg-black/55 px-2 py-[3px] text-[11px] font-extrabold backdrop-blur-sm [font-variant-numeric:tabular-nums]">
                <span className="brand-text">{photo.score !== null ? photo.score.toFixed(1) : "—"}</span>
                {photo.votes > 0 && (
                  <span className="text-[9px] font-semibold text-white opacity-80">· {photo.votes}</span>
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
              onClick={closeDetail}
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
          <div className="flex flex-col items-center gap-0.5 px-6 pb-8 pt-2">
            <div className="flex items-center justify-center gap-2.5">
              <span className="brand-text text-[34px] font-extrabold tracking-tight [font-variant-numeric:tabular-nums]">
                {detail.score !== null ? (
                  <>
                    {detail.score.toFixed(1)}
                    <span className="text-[15px] font-bold text-text-faint [-webkit-text-fill-color:var(--color-text-faint)]">/10</span>
                  </>
                ) : (
                  "—"
                )}
              </span>
              {editable && (
                <button
                  type="button"
                  onClick={() => setShowStats(true)}
                  aria-label="Statistiques"
                  title="Statistiques"
                  className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-full border border-border-strong bg-bg text-text"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </button>
              )}
            </div>
            <div className="text-[13px] font-semibold text-text-muted">
              {detail.score !== null
                ? `${detail.votes} vote${detail.votes > 1 ? "s" : ""}`
                : "En attente de votes"}
            </div>
          </div>
        </div>
      )}

      {detail && showStats && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 px-7">
          <div className="flex w-full max-w-[280px] flex-col gap-2.5 rounded-2xl bg-bg p-[18px] shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-extrabold text-text">Répartition des votes</span>
              <button
                type="button"
                onClick={() => setShowStats(false)}
                aria-label="Fermer"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-bg-page text-text-muted"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {detail.votes === 0 ? (
              <p className="py-2 text-center text-sm text-text-faint">
                Pas encore de vote sur cette photo.
              </p>
            ) : (
              [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((score) => {
                const count = detail.distribution[score - 1] ?? 0;
                const pct = (count / maxCount) * 100;
                return (
                  <div key={score} className="flex items-center gap-2">
                    <span className="brand-text w-3.5 flex-shrink-0 text-right text-[11px] font-extrabold [font-variant-numeric:tabular-nums]">
                      {score}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-page">
                      <div
                        className="brand-gradient h-full rounded-full transition-all"
                        style={{ width: `${count > 0 ? Math.max(pct, 6) : 0}%` }}
                      />
                    </div>
                    <span className="w-4 flex-shrink-0 text-[10px] font-bold text-text-faint [font-variant-numeric:tabular-nums]">
                      {count}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
}
