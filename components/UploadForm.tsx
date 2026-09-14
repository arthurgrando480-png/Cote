"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_SIZE = 16 * 1024 * 1024; // 16 Mo par photo, à l'envoi (avant redimensionnement)
const MAX_DIMENSION = 1600; // px sur le plus grand côté, une fois traitée
const MAX_PHOTOS = 9;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

type DecodedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  close?: () => void;
};

// Décode le fichier en essayant plusieurs méthodes, de la plus robuste à la
// plus permissive. La méthode moderne (createImageBitmap) échoue rarement,
// mais certaines photos très volumineuses peuvent saturer la mémoire de
// l'appareil : on retente alors avec un indice de redimensionnement, qui
// force un décodage bien plus économe. Le classique <img> sert de dernier
// recours pour les cas les plus rares.
async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch (err) {
      console.warn("Décodage direct impossible, nouvelle tentative en mode économe :", err);
    }
    try {
      const bitmap = await createImageBitmap(file, { resizeWidth: 2000, resizeQuality: "medium" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch (err) {
      console.warn("Décodage économe impossible, repli sur la méthode classique :", err);
    }
  }

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = URL.createObjectURL(file);
  });
  return { source: img, width: img.naturalWidth, height: img.naturalHeight };
}

// Combine rotation et redimensionnement en une seule passe, et ré-encode
// toujours en JPEG (le format le plus efficace pour des photos).
async function prepareImageForUpload(file: File, degrees: number): Promise<Blob> {
  const decoded = await decodeImage(file);
  try {
    const swap = degrees % 180 !== 0;
    const rotatedW = swap ? decoded.height : decoded.width;
    const rotatedH = swap ? decoded.width : decoded.height;

    const scale = Math.min(1, MAX_DIMENSION / Math.max(rotatedW, rotatedH));
    const outW = Math.round(rotatedW * scale);
    const outH = Math.round(rotatedH * scale);

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas indisponible");

    ctx.translate(outW / 2, outH / 2);
    ctx.rotate((degrees * Math.PI) / 180);
    const drawW = decoded.width * scale;
    const drawH = decoded.height * scale;
    ctx.drawImage(decoded.source, -drawW / 2, -drawH / 2, drawW, drawH);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("échec du rendu"))),
        "image/jpeg",
        0.85
      );
    });
  } finally {
    decoded.close?.();
  }
}

type PendingPhoto = {
  id: string;
  file: File;
  preview: string;
  rotation: number;
  name: string;
};

export default function UploadForm({ userId }: { userId: string }) {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<PendingPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setResultMessage(null);

    const incoming = Array.from(fileList);
    const accepted: PendingPhoto[] = [];
    let roomLeft = MAX_PHOTOS - items.length;
    let skippedForFormat = false;
    let skippedForSize = false;
    let skippedForRoom = false;

    for (const f of incoming) {
      if (roomLeft <= 0) {
        skippedForRoom = true;
        break;
      }
      if (!ACCEPTED.includes(f.type)) {
        skippedForFormat = true;
        continue;
      }
      if (f.size > MAX_SIZE) {
        skippedForSize = true;
        continue;
      }
      accepted.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file: f,
        preview: URL.createObjectURL(f),
        rotation: 0,
        name: "",
      });
      roomLeft--;
    }

    if (accepted.length > 0) setItems((prev) => [...prev, ...accepted]);

    const messages: string[] = [];
    if (skippedForRoom) messages.push(`maximum ${MAX_PHOTOS} photos à la fois`);
    if (skippedForFormat) messages.push("formats acceptés : JPEG, PNG ou WebP");
    if (skippedForSize) messages.push("une photo dépassait 16 Mo");
    if (messages.length) setError("Certaines photos ont été ignorées (" + messages.join(", ") + ").");
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((it) => it.id !== id);
    });
  }

  function rotateItem(id: string) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, rotation: (it.rotation + 90) % 360 } : it))
    );
  }

  function renameItem(id: string, name: string) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, name } : it)));
  }

  async function processOne(item: PendingPhoto): Promise<"approved" | "rejected" | "failed"> {
    let blob: Blob;
    try {
      blob = await prepareImageForUpload(item.file, item.rotation);
    } catch (err) {
      console.error("Traitement de l'image impossible :", err);
      return "failed";
    }

    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(path, blob, { cacheControl: "3600", upsert: false, contentType: "image/jpeg" });
    if (uploadError) return "failed";

    const trimmedName = item.name.trim();
    const { data: inserted, error: insertError } = await supabase
      .from("photos")
      .insert({ owner_id: userId, storage_path: path, name: trimmedName || null })
      .select("id")
      .single();
    if (insertError || !inserted) return "failed";

    try {
      const res = await fetch("/api/moderate-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: inserted.id }),
      });
      const data = await res.json();
      return data.status === "rejected" ? "rejected" : "approved";
    } catch {
      return "approved";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);
    setError(null);
    setResultMessage(null);

    const results = await Promise.all(items.map(processOne));

    items.forEach((it) => URL.revokeObjectURL(it.preview));
    setItems([]);
    if (inputRef.current) inputRef.current.value = "";
    setLoading(false);

    const approved = results.filter((r) => r === "approved").length;
    const rejected = results.filter((r) => r === "rejected").length;
    const failed = results.filter((r) => r === "failed").length;

    const parts: string[] = [];
    if (approved > 0) parts.push(`${approved} photo${approved > 1 ? "s" : ""} publiée${approved > 1 ? "s" : ""}`);
    if (rejected > 0) parts.push(`${rejected} refusée${rejected > 1 ? "s" : ""} par la modération`);
    if (failed > 0) parts.push(`${failed} en échec, réessaie`);
    setResultMessage(parts.join(" · "));

    router.refresh();
  }

  const canAddMore = items.length < MAX_PHOTOS;

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col items-center gap-5">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {items.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative flex aspect-[3/4] w-full max-w-[250px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[20px] border-[1.5px] border-dashed border-border-strong bg-bg-page text-center transition-colors hover:border-brand-solid hover:bg-brand-tint"
        >
          <span className="flex flex-col items-center gap-1 px-6 text-text-muted">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="mb-1.5 h-[30px] w-[30px] text-text-faint">
              <path d="M12 16V4" />
              <path d="M7 9l5-5 5 5" />
              <rect x="3" y="16" width="18" height="5" rx="2" />
            </svg>
            <span className="font-bold text-text">Choisis tes photos</span>
            <span className="text-[11px] text-text-faint">Jusqu'à {MAX_PHOTOS} à la fois — JPEG, PNG ou WebP, 16 Mo max chacune</span>
          </span>
        </button>
      ) : (
        <div className="flex w-full flex-col gap-2.5">
          <p className="text-center text-xs font-bold text-text-muted">
            {items.length} / {MAX_PHOTOS} photos sélectionnées
          </p>
          <div className="flex flex-col gap-2.5">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative h-20 w-[60px] flex-shrink-0 overflow-hidden rounded-xl border border-border bg-bg-page">
                  <img
                    src={item.preview}
                    alt="Aperçu"
                    style={{ transform: `rotate(${item.rotation}deg)` }}
                    className="h-full w-full object-cover transition-transform"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label="Retirer cette photo"
                    title="Retirer"
                    className="absolute left-[3px] top-[3px] z-[2] flex h-[19px] w-[19px] items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/75"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[10px] w-[10px]">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => rotateItem(item.id)}
                    aria-label="Pivoter cette photo"
                    title="Pivoter"
                    className="absolute right-[3px] top-[3px] z-[2] flex h-[19px] w-[19px] items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/75"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[10px] w-[10px]">
                      <path d="M21 12a9 9 0 1 1-3.2-6.9" />
                      <polyline points="21 3 21 9 15 9" />
                    </svg>
                  </button>
                </div>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => renameItem(item.id, e.target.value)}
                  maxLength={60}
                  placeholder="Nom de la photo (facultatif)"
                  className="min-w-0 flex-1 rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text outline-none focus:border-brand-solid"
                />
              </div>
            ))}
            {canAddMore && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-strong bg-bg-page py-3 text-sm font-bold text-text-faint transition-colors hover:border-brand-solid hover:text-brand-solid"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Ajouter des photos
              </button>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-center text-sm text-red-500">{error}</p>}
      {resultMessage && (
        <p className="text-center text-sm font-bold text-brand-solid">{resultMessage}</p>
      )}

      <button
        type="submit"
        disabled={items.length === 0 || loading}
        className="brand-gradient w-full rounded-full py-3 font-bold text-white shadow-[0_10px_20px_-4px_rgba(15,174,107,.32)] transition-opacity hover:opacity-90 disabled:opacity-40 disabled:shadow-none"
      >
        {loading
          ? "Envoi…"
          : items.length > 1
            ? `Publier ${items.length} photos`
            : "Publier ma photo"}
      </button>
    </form>
  );
}
