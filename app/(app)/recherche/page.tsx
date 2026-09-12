import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SearchScreen from "@/components/SearchScreen";

export default async function RecherchePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <SearchScreen currentUserId={user.id} />;
}
