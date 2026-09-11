import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UploadForm from "@/components/UploadForm";

export default async function UploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <p className="text-[11px] font-bold uppercase tracking-widest text-text-faint">
          Publier
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-text">
          Propose une photo
        </h1>
      </div>
      <UploadForm userId={user.id} />
    </div>
  );
}
