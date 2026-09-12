"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeletePhotoButton({
  photoId,
  storagePath,
}: {
  photoId: string;
  storagePath: string;
}) {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Supprimer cette photo et ses votes ?")) return;
    setLoading(true);
    await supabase.storage.from("photos").remove([storagePath]);
    await supabase.from("photos").delete().eq("id", photoId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      aria-label="Supprimer"
      className="absolute right-1.5 top-1.5 z-[2] flex h-[26px] w-[26px] items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/75 disabled:opacity-50"
    >
      {loading ? (
        <span className="text-[9px] font-bold">…</span>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[13px] w-[13px]">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      )}
    </button>
  );
}
