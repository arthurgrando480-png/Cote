import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DarkModeToggle from "@/components/DarkModeToggle";
import LogoutButton from "@/components/LogoutButton";

export default async function ParametresPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
      <DarkModeToggle />
      <LogoutButton />
    </div>
  );
}
