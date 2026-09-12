import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TopHeader from "@/components/TopHeader";
import BottomTabBar from "@/components/BottomTabBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <TopHeader />
      <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
      <BottomTabBar />
    </div>
  );
}
