"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function FanButton({
  currentUserId,
  targetUserId,
  initialIsFan,
  initialIsFriend,
}: {
  currentUserId: string;
  targetUserId: string;
  initialIsFan: boolean;
  initialIsFriend: boolean;
}) {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const [isFan, setIsFan] = useState(initialIsFan);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    if (isFan) {
      await supabase
        .from("fans")
        .delete()
        .eq("fan_id", currentUserId)
        .eq("target_id", targetUserId);
    } else {
      await supabase.from("fans").insert({ fan_id: currentUserId, target_id: targetUserId });
    }
    setIsFan(!isFan);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
          isFan
            ? "border border-border-strong bg-bg text-text-muted hover:border-red-400 hover:text-red-500"
            : "brand-gradient text-white"
        }`}
      >
        {isFan ? "Fan ✓" : "Devenir fan"}
      </button>
      {initialIsFriend && (
        <span className="rounded-full bg-brand-tint px-2.5 py-1 text-[11px] font-bold text-brand-solid">
          Amis
        </span>
      )}
    </div>
  );
}
