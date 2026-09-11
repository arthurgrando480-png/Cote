import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RatingFeed from "@/components/RatingFeed";

export default async function RatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <RatingFeed userId={user.id} />;
}
