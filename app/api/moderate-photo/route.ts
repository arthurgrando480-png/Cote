import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Seuils de refus. Sightengine recommande 0.5 comme seuil de départ pour le
// gore ; on applique la même logique aux catégories de nudité les plus
// explicites. À ajuster si besoin une fois que tu as un peu de recul.
const NUDITY_THRESHOLD = 0.5;
const GORE_THRESHOLD = 0.5;

export async function POST(request: Request) {
  const { photoId } = await request.json();

  if (!photoId) {
    return NextResponse.json({ error: "photoId manquant" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // On relit la photo via le client de l'utilisateur : la RLS garantit déjà
  // qu'il ne peut voir/toucher que sa propre photo à ce stade (pending).
  const { data: photo, error: photoError } = await supabase
    .from("photos")
    .select("id, owner_id, storage_path")
    .eq("id", photoId)
    .single();

  if (photoError || !photo || photo.owner_id !== user.id) {
    return NextResponse.json({ error: "Photo introuvable" }, { status: 404 });
  }

  const { data: urlData } = supabase.storage
    .from("photos")
    .getPublicUrl(photo.storage_path as string);

  const admin = createAdminClient();
  const apiUser = process.env.SIGHTENGINE_API_USER;
  const apiSecret = process.env.SIGHTENGINE_API_SECRET;

  // Si la modération n'est pas encore configurée (clés absentes), on
  // approuve par défaut pour ne pas bloquer la publication.
  if (!apiUser || !apiSecret) {
    const { error: updateError } = await admin
      .from("photos")
      .update({ moderation_status: "approved" })
      .eq("id", photoId);
    if (updateError) {
      console.error("Échec mise à jour (pas de clés Sightengine):", updateError);
      return NextResponse.json({ status: "pending", error: updateError.message });
    }
    return NextResponse.json({ status: "approved" });
  }

  let status: "approved" | "rejected" = "approved";

  try {
    const params = new URLSearchParams({
      url: urlData.publicUrl,
      models: "nudity-2.1,gore-2.0",
      api_user: apiUser,
      api_secret: apiSecret,
    });

    const res = await fetch(
      `https://api.sightengine.com/1.0/check.json?${params.toString()}`
    );
    const result = await res.json();

    if (result.status !== "success") {
      console.error("Réponse Sightengine inattendue:", JSON.stringify(result));
    }

    const nudity = result?.nudity ?? {};
    const gore = result?.gore ?? {};

    const isExplicit =
      (nudity.sexual_activity ?? 0) >= NUDITY_THRESHOLD ||
      (nudity.sexual_display ?? 0) >= NUDITY_THRESHOLD ||
      (nudity.erotica ?? 0) >= NUDITY_THRESHOLD;

    const isGraphic = (gore.prob ?? 0) >= GORE_THRESHOLD;

    status = isExplicit || isGraphic ? "rejected" : "approved";
  } catch (err) {
    // Panne de l'API de modération : on n'empêche pas la publication pour
    // autant, mais on le journalise pour pouvoir vérifier plus tard.
    console.error("Erreur modération Sightengine:", err);
    status = "approved";
  }

  const { error: updateError } = await admin
    .from("photos")
    .update({ moderation_status: status })
    .eq("id", photoId);

  if (updateError) {
    console.error("Échec mise à jour du statut de modération:", updateError);
    return NextResponse.json(
      { status: "pending", error: updateError.message },
      { status: 500 }
    );
  }

  if (status === "rejected") {
    const { error: removeError } = await admin.storage
      .from("photos")
      .remove([photo.storage_path as string]);
    if (removeError) {
      console.error("Échec suppression du fichier refusé:", removeError);
    }
  }

  return NextResponse.json({ status });
}
