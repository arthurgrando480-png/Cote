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
    <div className="flex min-h-dvh flex-col">
      <TopHeader />
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
      </main>
      <BottomTabBar />
    </div>
  );
}
