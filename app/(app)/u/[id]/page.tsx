import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileGrid, { type GridPhoto } from "@/components/ProfileGrid";
import FanButton from "@/components/FanButton";

type PhotoStatsRow = {
  photo_id: string;
  avg_score: string | number | null;
  vote_count: number;
  distribution: number[];
};

export default async function VisitedProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (id === user.id) redirect("/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("pseudo, avatar_url, is_private")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const { data: fanRow } = await supabase
    .from("fans")
    .select("fan_id")
    .eq("fan_id", user.id)
    .eq("target_id", id)
    .maybeSingle();
  const isFan = !!fanRow;

  const { data: isFriend } = await supabase.rpc("are_friends", { a: user.id, b: id });

  const isBlockedByPrivacy = profile.is_private && !isFriend;

  const { data: photos } = isBlockedByPrivacy
    ? { data: [] as { id: string; storage_path: string; created_at: string; moderation_status: string }[] }
    : await supabase
        .from("photos")
        .select("id, storage_path, created_at, moderation_status")
        .eq("owner_id", id)
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false });

  const photoIds = (photos ?? []).map((p) => p.id as string);

  const { data: statsRows } = photoIds.length
    ? await supabase.rpc("get_photo_stats", { p_photo_ids: photoIds })
    : { data: [] as PhotoStatsRow[] };

  const statsByPhoto = new Map<string, PhotoStatsRow>();
  for (const row of (statsRows ?? []) as PhotoStatsRow[]) {
    statsByPhoto.set(row.photo_id, row);
  }

  const gridPhotos: GridPhoto[] = (photos ?? []).map((photo) => {
    const stats = statsByPhoto.get(photo.id as string);
    const { data: urlData } = supabase.storage
      .from("photos")
      .getPublicUrl(photo.storage_path as string);
    const voteCount = stats?.vote_count ?? 0;
    return {
      id: photo.id as string,
      url: urlData.publicUrl,
      storagePath: photo.storage_path as string,
      createdAt: photo.created_at as string,
      moderationStatus: "approved",
      score: voteCount > 0 ? parseFloat(String(stats?.avg_score)) : null,
      votes: voteCount,
      distribution: stats?.distribution ?? new Array(10).fill(0),
    };
  });

  return (
    <div className="flex flex-1 flex-col gap-4 pt-5">
      <div className="flex items-center gap-3.5 px-5">
        <span
          className="block h-16 w-16 flex-shrink-0 rounded-full border border-border bg-bg-page bg-cover bg-center brand-gradient"
          style={
            profile.avatar_url ? { backgroundImage: `url(${profile.avatar_url})` } : undefined
          }
        />
        <div className="flex flex-col gap-1.5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-faint">
              Profil
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-text">
              {profile.pseudo}
            </h1>
          </div>
          <FanButton
            currentUserId={user.id}
            targetUserId={id}
            initialIsFan={isFan}
            initialIsFriend={!!isFriend}
          />
        </div>
      </div>

      {isBlockedByPrivacy ? (
        <p className="px-5 text-text-muted">
          Ce compte est privé. Seuls ses amis peuvent voir ses photos.
        </p>
      ) : (
        <ProfileGrid photos={gridPhotos} editable={false} />
      )}
    </div>
  );
}
