import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Appelée chaque dimanche par Vercel Cron (voir vercel.json). Ne calcule
// rien elle-même : le classement est calculé à la volée quand quelqu'un
// ouvre l'écran (get_weekly_leaderboard). Ici, on se contente de prévenir
// tout le monde qu'il est prêt à consulter.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profiles, error } = await admin.from("profiles").select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (profiles ?? []).map((p) => ({
    user_id: p.id as string,
    type: "weekly_leaderboard" as const,
    count: 1,
    is_read: false,
  }));

  if (rows.length > 0) {
    const { error: insertError } = await admin.from("notifications").insert(rows);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, notified: rows.length });
}
