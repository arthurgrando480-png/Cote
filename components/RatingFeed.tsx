"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ScoreBoard from "./ScoreBoard";
import ReportSheet from "./ReportSheet";

type ProfileInfo = { pseudo: string; avatar_url: string | null };
type Photo = {
  id: string;
  storage_path: string;
  url: string;
  ownerId: string;
  owner: ProfileInfo | null;
};

function normalizeProfile(
  value: ProfileInfo | ProfileInfo[] | null
): ProfileInfo | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default function RatingFeed({ userId }: { userId: string }) {
  const [supabase] = useState(() => createClient());
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [zoomedIn, setZoomedIn] = useState(false);
  const friendIdsRef = useRef<Set<string> | null>(null);

  const getFriendIds = useCallback(async () => {
    if (friendIdsRef.current) return friendIdsRef.current;
    const { data } = await supabase.rpc("get_friend_ids", { u: userId });
    const set = new Set<string>((data ?? []).map((r: { friend_id: string }) => r.friend_id));
    friendIdsRef.current = set;
    return set;
  }, [supabase, userId]);

  const loadNext = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPreviewOpen(false);
    setZoomedIn(false);

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
    const friendIds = await getFriendIds();

    let query = supabase
      .from("photos")
      .select("id, storage_path, owner_id, profiles(pseudo, avatar_url)")
      .eq("is_active", true)
      .eq("moderation_status", "approved")
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

    // Priorité aux photos des amis (fans mutuels) parmi les candidates
    // disponibles ; on retombe sur tout le monde s'il n'y en a pas.
    const friendCandidates = candidates.filter((c) => friendIds.has(c.owner_id as string));
    const pool = friendCandidates.length > 0 ? friendCandidates : candidates;

    const pick = pool[Math.floor(Math.random() * pool.length)] as {
      id: string;
      storage_path: string;
      owner_id: string;
      profiles: ProfileInfo | ProfileInfo[] | null;
    };
    const { data: urlData } = supabase.storage
      .from("photos")
      .getPublicUrl(pick.storage_path);

    setPhoto({
      id: pick.id,
      storage_path: pick.storage_path,
      url: urlData.publicUrl,
      ownerId: pick.owner_id,
      owner: normalizeProfile(pick.profiles),
    });
    setLoading(false);
  }, [supabase, userId, getFriendIds]);

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
      score !== null ? 250 : 0
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
        <img
          src={photo.url}
          alt="Photo à noter"
          onClick={() => setPreviewOpen(true)}
          className="absolute inset-0 h-full w-full cursor-zoom-in object-cover transition-opacity duration-150"
        />
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-[22%] bg-gradient-to-b from-black/50 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black/60 to-transparent" />

      <div className="absolute inset-x-3.5 top-3.5 z-[4] flex items-center justify-start gap-2">
        {photo?.owner && (
          <Link
            href={`/u/${photo.ownerId}`}
            className="flex items-center gap-1.5 rounded-full bg-black/40 py-1.5 pl-1.5 pr-3 text-xs font-bold text-white backdrop-blur-md"
          >
            <span
              className="h-[22px] w-[22px] flex-shrink-0 rounded-full bg-cover bg-center brand-gradient"
              style={
                photo.owner.avatar_url
                  ? { backgroundImage: `url(${photo.owner.avatar_url})` }
                  : undefined
              }
            />
            {photo.owner.pseudo}
          </Link>
        )}
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          aria-label="Signaler cette photo"
          title="Signaler"
          className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" y1="22" x2="4" y2="15" />
          </svg>
        </button>
      </div>

      <button
        type="button"
        onClick={() => submit(null)}
        disabled={submitting}
        className="absolute right-3.5 top-3.5 z-[4] rounded-full border border-white/45 bg-white/15 px-4 py-2 text-[13px] font-bold text-white backdrop-blur-md transition-colors hover:bg-white/25 disabled:opacity-40"
      >
        Passer
      </button>

      {error && (
        <p className="absolute left-1/2 top-16 z-[4] -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
          {error}
        </p>
      )}

      {photo && (
        <div className="absolute inset-x-0 bottom-[18px] z-[4] flex justify-center px-4">
          <ScoreBoard key={photo.id} onSelect={(n) => submit(n)} disabled={submitting} />
        </div>
      )}

      <ReportSheet
        open={reportOpen}
        photoId={photo?.id ?? null}
        onClose={() => setReportOpen(false)}
        onReported={() => submit(null)}
      />

      {previewOpen && photo && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black">
          <div className="relative flex-1 overflow-hidden">
            <img
              src={photo.url}
              alt=""
              onClick={() => setZoomedIn((z) => !z)}
              className={`absolute inset-0 h-full w-full object-contain transition-transform duration-200 ${
                zoomedIn ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"
              }`}
            />
          </div>
          <div className="flex items-center justify-center border-t border-white/10 bg-black py-3">
            <button
              type="button"
              onClick={() => {
                setPreviewOpen(false);
                setZoomedIn(false);
              }}
              aria-label="Fermer l'aperçu"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 text-white"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
