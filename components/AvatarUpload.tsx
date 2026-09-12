"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_DIMENSION = 400; // px — un avatar ne s'affiche jamais très grand

function resizeAvatar(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const outW = Math.round(img.width * scale);
      const outH = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas indisponible"));
      ctx.drawImage(img, 0, 0, outW, outH);

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

export default function AvatarUpload({
  userId,
  avatarUrl,
}: {
  userId: string;
  avatarUrl: string | null;
}) {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [loading, setLoading] = useState(false);

  async function handleFile(file: File | null) {
    if (!file) return;
    setLoading(true);

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    let toUpload: Blob;
    try {
      toUpload = await resizeAvatar(file);
    } catch {
      setLoading(false);
      return;
    }

    const path = `${userId}/avatar-${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(path, toUpload, {
        cacheControl: "3600",
        upsert: false,
        contentType: "image/jpeg",
      });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", userId);
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <div className="relative flex-shrink-0">
      <span
        className="block h-16 w-16 rounded-full border border-border bg-bg-page bg-cover bg-center brand-gradient"
        style={preview ? { backgroundImage: `url(${preview})` } : undefined}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        aria-label="Changer la photo de profil"
        title="Changer la photo de profil"
        className="brand-gradient absolute -bottom-0.5 -right-0.5 z-[2] flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-bg text-white disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[13px] w-[13px]">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
