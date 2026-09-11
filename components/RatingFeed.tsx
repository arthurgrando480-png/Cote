"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ScoreBoard from "./ScoreBoard";

type Photo = { id: string; storage_path: string; url: string };

export default function RatingFeed({ userId }: { userId: string }) {
  const [supabase] = useState(() => createClient());
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNext = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: seen, error: seenError } = await supabase
      .from("ratings")
      .select("photo_id")
      .eq("rater_id", userId);

    if (seenError) {
      setError("Impossible de charger la suite. Réessaie dans un instant.");
      setLoading(false);
      return;
    }

    const seenIds = (seen ?? []).map((r) => r.photo_id as string);

    let query = supabase
      .from("photos")
      .select("id, storage_path")
      .eq("is_active", true)
      .neq("owner_id", userId)
      .limit(30);

    if (seenIds.length > 0) {
      query = query.not("id", "in", `(${seenIds.join(",")})`);
    }

    const { data: candidates, error: candidatesError } = await query;

    if (candidatesError) {
      setError("Impossible de charger la suite. Réessaie dans un instant.");
      setLoading(false);
      return;
    }

    if (!candidates || candidates.length === 0) {
      setEmpty(true);
      setPhoto(null);
      setLoading(false);
      return;
    }

    setEmpty(false);
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    const { data: urlData } = supabase.storage
      .from("photos")
      .getPublicUrl(pick.storage_path as string);

    setPhoto({
      id: pick.id as string,
      storage_path: pick.storage_path as string,
      url: urlData.publicUrl,
    });
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    loadNext();
  }, [loadNext]);

  async function submit(score: number | null) {
    if (!photo || submitting) return;
    setSubmitting(true);

    const { error: insertError } = await supabase.from("ratings").insert({
      photo_id: photo.id,
      rater_id: userId,
      score,
    });

    if (insertError) {
      setError("Le vote n'a pas pu être enregistré. Réessaie.");
      setSubmitting(false);
      return;
    }

    window.setTimeout(
      () => {
        setSubmitting(false);
        loadNext();
      },
      score !== null ? 300 : 0
    );
  }

  if (loading && !photo) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-text-faint">
        Chargement…
      </div>
    );
  }

  if (empty) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-2xl font-extrabold text-text">
          Plus rien à noter pour l&apos;instant.
        </p>
        <p className="max-w-sm text-text-muted">
          Reviens un peu plus tard, ou publie une photo pour donner envie aux
          autres d&apos;en ajouter aussi.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden bg-bg-page">
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.url}
          alt="Photo à noter"
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-150"
        />
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black/60 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2.5 px-4 pb-2.5 pt-2.5">
        {error && (
          <p className="rounded-full bg-black/50 px-3 py-1 text-xs text-white">
            {error}
          </p>
        )}
        {photo && (
          <ScoreBoard
            key={photo.id}
            onSelect={(n) => submit(n)}
            onSkip={() => submit(null)}
            disabled={submitting}
          />
        )}
      </div>
    </div>
  );
}
