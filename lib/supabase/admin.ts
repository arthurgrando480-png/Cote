import { createClient } from "@supabase/supabase-js";

// Client "admin" — utilise la clé secrète (jamais exposée au navigateur) pour
// contourner la RLS. Réservé aux routes serveur agissant au nom du système
// lui-même (ex: valider/refuser une photo après modération).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } }
  );
}
