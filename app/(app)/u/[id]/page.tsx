import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileGrid, { type GridPhoto } from "@/components/ProfileGrid";

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
    .select("pseudo, avatar_url")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const { data: photos } = await supabase
    .from("photos")
    .select("id, storage_path, created_at, moderation_status")
    .eq("owner_id", id)
    .eq("moderation_status", "approved")
    .order("created_at", { ascending: false });

  const photoIds = (photos ?? []).map((p) => p.id as string);

  const { data: ratings } = photoIds.length
    ? await supabase.from("ratings").select("photo_id, score").in("photo_id", photoIds)
    : { data: [] as { photo_id: string; score: number | null }[] };

  const statsByPhoto = new Map<string, { sum: number; count: number }>();
  for (const r of ratings ?? []) {
    if (r.score === null) continue;
    const s = statsByPhoto.get(r.photo_id as string) ?? { sum: 0, count: 0 };
    s.sum += r.score as number;
    s.count += 1;
    statsByPhoto.set(r.photo_id as string, s);
  }

  const gridPhotos: GridPhoto[] = (photos ?? []).map((photo) => {
    const stats = statsByPhoto.get(photo.id as string);
    const { data: urlData } = supabase.storage
      .from("photos")
      .getPublicUrl(photo.storage_path as string);
    return {
      id: photo.id as string,
      url: urlData.publicUrl,
      storagePath: photo.storage_path as string,
      createdAt: photo.created_at as string,
      moderationStatus: "approved",
      score: stats ? stats.sum / stats.count : null,
      votes: stats?.count ?? 0,
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
        <div className="flex flex-col">
          <p className="text-[11px] font-bold uppercase tracking-widest text-text-faint">
            Profil
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-text">
            {profile.pseudo}
          </h1>
        </div>
      </div>

      <ProfileGrid photos={gridPhotos} editable={false} />
    </div>
  );
}
