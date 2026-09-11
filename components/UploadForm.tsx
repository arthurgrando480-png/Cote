"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_SIZE = 8 * 1024 * 1024; // 8 Mo
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export default function UploadForm({ userId }: { userId: string }) {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleFile(f: File | null) {
    setError(null);
    setSuccess(false);
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
      setError("La photo dépasse 8 Mo.");
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

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      setError("L'envoi a échoué. Réessaie dans un instant.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("photos")
      .insert({ owner_id: userId, storage_path: path });

    if (insertError) {
      setError(
        "La photo est envoyée mais n'a pas pu être enregistrée. Contacte le support."
      );
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess(true);
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col items-center gap-5"
    >
      <label
        htmlFor="photo"
        className="flex aspect-[3/4] w-full max-w-[250px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[20px] border-[1.5px] border-dashed border-border-strong bg-bg-page text-center transition-colors hover:border-brand-solid hover:bg-brand-tint"
      >
        {preview ? (
          <img
            src={preview}
            alt="Aperçu"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex flex-col items-center gap-1 px-6 text-text-muted">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="mb-1.5 h-[30px] w-[30px] text-text-faint">
              <path d="M12 16V4" />
              <path d="M7 9l5-5 5 5" />
              <rect x="3" y="16" width="18" height="5" rx="2" />
            </svg>
            <span className="font-bold text-text">Choisis une photo</span>
            <span className="text-[11px] text-text-faint">JPEG, PNG ou WebP — 8 Mo max</span>
          </span>
        )}
      </label>
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
