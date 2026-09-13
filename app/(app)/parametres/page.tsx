import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DarkModeToggle from "@/components/DarkModeToggle";
import PrivateModeToggle from "@/components/PrivateModeToggle";
import LogoutButton from "@/components/LogoutButton";

export default async function ParametresPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_private")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
      <DarkModeToggle />
      <PrivateModeToggle userId={user.id} initialIsPrivate={profile?.is_private ?? false} />
      <LogoutButton />
    </div>
  );
}
