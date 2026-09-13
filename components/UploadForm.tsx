"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_SIZE = 16 * 1024 * 1024; // 16 Mo à l'envoi (avant redimensionnement)
const MAX_DIMENSION = 1600; // px sur le plus grand côté, une fois traitée
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

// Combine rotation et redimensionnement en une seule passe, et ré-encode
// toujours en JPEG (le format le plus efficace pour des photos).
function prepareImageForUpload(file: File, degrees: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const swap = degrees % 180 !== 0;
      const rotatedW = swap ? img.height : img.width;
      const rotatedH = swap ? img.width : img.height;

      const scale = Math.min(1, MAX_DIMENSION / Math.max(rotatedW, rotatedH));
      const outW = Math.round(rotatedW * scale);
      const outH = Math.round(rotatedH * scale);

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas indisponible"));

      ctx.translate(outW / 2, outH / 2);
      ctx.rotate((degrees * Math.PI) / 180);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("échec du rendu"))),
        "image/jpeg",
        0.85
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export default function UploadForm({ userId }: { userId: string }) {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleFile(f: File | null) {
    setError(null);
    setSuccess(false);
    setRotation(0);
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!ACCEPTED.includes(f.type)) {
      setError("Formats acceptés : JPEG, PNG ou WebP.");
      return;
    }
    if (f.size > MAX_SIZE) {
      setError("La photo dépasse 16 Mo.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);

    let toUpload: Blob;
    try {
      toUpload = await prepareImageForUpload(file, rotation);
    } catch (err) {
      const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      console.error("Traitement de l'image impossible :", err);
      setError(
        `Cette photo n'a pas pu être traitée sur cet appareil. Détail technique (à me transmettre si ça se reproduit) : ${detail}`
      );
      setLoading(false);
      return;
    }

    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(path, toUpload, {
        cacheControl: "3600",
        upsert: false,
        contentType: "image/jpeg",
      });

    if (uploadError) {
      setError("L'envoi a échoué. Réessaie dans un instant.");
      setLoading(false);
      return;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("photos")
      .insert({ owner_id: userId, storage_path: path })
      .select("id")
      .single();

    if (insertError || !inserted) {
      setError("La photo est envoyée mais n'a pas pu être enregistrée. Contacte le support.");
      setLoading(false);
      return;
    }

    let moderationStatus: "approved" | "rejected" = "approved";
    try {
      const res = await fetch("/api/moderate-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: inserted.id }),
      });
      const data = await res.json();
      if (data.status === "rejected") moderationStatus = "rejected";
    } catch {
      moderationStatus = "approved";
    }

    setLoading(false);
    setFile(null);
    setPreview(null);
    setRotation(0);
    if (inputRef.current) inputRef.current.value = "";

    if (moderationStatus === "rejected") {
      setError("Cette photo a été refusée par la modération automatique (contenu non autorisé).");
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col items-center gap-5">
      <div className="relative aspect-[3/4] w-full max-w-[250px] overflow-hidden rounded-[20px] border-[1.5px] border-dashed border-border-strong bg-bg-page">
        <label
          htmlFor="photo"
          className="flex h-full w-full cursor-pointer flex-col items-center justify-center text-center transition-colors hover:border-brand-solid hover:bg-brand-tint"
        >
          {preview ? (
            <img
              src={preview}
              alt="Aperçu"
              style={{ transform: `rotate(${rotation}deg)` }}
              className="h-full w-full object-cover transition-transform"
            />
          ) : (
            <span className="flex flex-col items-center gap-1 px-6 text-text-muted">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="mb-1.5 h-[30px] w-[30px] text-text-faint">
                <path d="M12 16V4" />
                <path d="M7 9l5-5 5 5" />
                <rect x="3" y="16" width="18" height="5" rx="2" />
              </svg>
              <span className="font-bold text-text">Choisis une photo</span>
              <span className="text-[11px] text-text-faint">JPEG, PNG ou WebP — 16 Mo max</span>
            </span>
          )}
        </label>
        {preview && (
          <button
            type="button"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            aria-label="Pivoter la photo"
            title="Pivoter"
            className="absolute right-2 top-2 z-[2] flex h-[34px] w-[34px] items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm hover:bg-black/75"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px]">
              <path d="M21 12a9 9 0 1 1-3.2-6.9" />
              <polyline points="21 3 21 9 15 9" />
            </svg>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        id="photo"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && (
        <p className="text-sm font-bold text-brand-solid">
          Photo publiée. Elle va commencer à être notée.
        </p>
      )}

      <button
        type="submit"
        disabled={!file || loading}
        className="brand-gradient w-full rounded-full py-3 font-bold text-white shadow-[0_10px_20px_-4px_rgba(15,174,107,.32)] transition-opacity hover:opacity-90 disabled:opacity-40 disabled:shadow-none"
      >
        {loading ? "Envoi…" : "Publier ma photo"}
      </button>
    </form>
  );
}
