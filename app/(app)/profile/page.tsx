import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeletePhotoButton from "@/components/DeletePhotoButton";
import PendingPhotoRetry from "@/components/PendingPhotoRetry";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("pseudo")
    .eq("id", user.id)
    .single();

  const { data: photos } = await supabase
    .from("photos")
    .select("id, storage_path, created_at, moderation_status")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const photoIds = (photos ?? []).map((p) => p.id as string);
  const pendingIds = (photos ?? [])
    .filter((p) => p.moderation_status === "pending")
    .map((p) => p.id as string);

  const { data: ratings } = photoIds.length
    ? await supabase
        .from("ratings")
        .select("photo_id, score")
        .in("photo_id", photoIds)
    : { data: [] as { photo_id: string; score: number | null }[] };

  const statsByPhoto = new Map<string, { sum: number; count: number }>();
  for (const r of ratings ?? []) {
    if (r.score === null) continue;
    const s = statsByPhoto.get(r.photo_id as string) ?? { sum: 0, count: 0 };
    s.sum += r.score as number;
    s.count += 1;
    statsByPhoto.set(r.photo_id as string, s);
  }

  return (
    <div className="flex flex-1 flex-col gap-4 pt-5">
      <PendingPhotoRetry photoIds={pendingIds} />

      <div className="px-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-text-faint">
          Mon profil
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-text">
          {profile?.pseudo ?? user.email}
        </h1>
      </div>

      {!photos || photos.length === 0 ? (
        <p className="px-5 text-text-muted">
          Tu n&apos;as pas encore publié de photo. Rends-toi sur « Publier »
          pour ajouter la première.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-[2px]">
          {photos.map((photo) => {
            const stats = statsByPhoto.get(photo.id as string);
            const { data: urlData } = supabase.storage
              .from("photos")
              .getPublicUrl(photo.storage_path as string);
            return (
              <div
                key={photo.id as string}
                className="relative aspect-[3/4] overflow-hidden bg-bg-page"
              >
                <img
                  src={urlData.publicUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
                {photo.moderation_status === "pending" && (
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/55 px-2 py-[3px] text-[11px] font-extrabold text-white backdrop-blur-sm">
                    En modération
                  </span>
                )}
                {photo.moderation_status === "rejected" && (
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-red-500/80 px-2 py-[3px] text-[11px] font-extrabold text-white backdrop-blur-sm">
                    Refusée
                  </span>
                )}
                {photo.moderation_status === "approved" && (
                  <span className="absolute bottom-1.5 left-1.5 flex items-baseline gap-1 rounded-full bg-black/55 px-2 py-[3px] text-[11px] font-extrabold text-white backdrop-blur-sm [font-variant-numeric:tabular-nums]">
                    {stats ? (stats.sum / stats.count).toFixed(1) : "—"}
                    {stats && (
                      <span className="text-[9px] font-semibold opacity-80">
                        · {stats.count}
                      </span>
                    )}
                  </span>
                )}
                <DeletePhotoButton
                  photoId={photo.id as string}
                  storagePath={photo.storage_path as string}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
