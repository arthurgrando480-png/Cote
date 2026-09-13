"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PrivateModeToggle({
  userId,
  initialIsPrivate,
}: {
  userId: string;
  initialIsPrivate: boolean;
}) {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const [isPrivate, setIsPrivate] = useState(initialIsPrivate);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const next = !isPrivate;
    const { error } = await supabase.from("profiles").update({ is_private: next }).eq("id", userId);
    if (!error) {
      setIsPrivate(next);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3.5">
      <div className="flex flex-col">
        <span className="text-sm font-bold text-text">Compte privé</span>
        <span className="text-xs text-text-muted">Seuls tes amis peuvent voir tes photos</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isPrivate}
        aria-label="Activer le compte privé"
        onClick={toggle}
        disabled={loading}
        className="flex h-[26px] w-[46px] flex-shrink-0 items-center rounded-full p-[3px] transition-colors disabled:opacity-60"
        style={{
          background: isPrivate
            ? "linear-gradient(135deg, var(--color-brand-1), var(--color-brand-2))"
            : "var(--color-border-strong)",
        }}
      >
        <span
          className="block h-5 w-5 rounded-full bg-white shadow transition-transform"
          style={{ transform: isPrivate ? "translateX(20px)" : "translateX(0)" }}
        />
      </button>
    </div>
  );
}
