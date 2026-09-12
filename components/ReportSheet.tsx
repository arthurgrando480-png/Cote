"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const REASONS = [
  "Nudité ou contenu sexuel",
  "Violence ou contenu choquant",
  "Ce n'est pas sa photo",
  "Autre",
];

export default function ReportSheet({
  open,
  photoId,
  onClose,
  onReported,
}: {
  open: boolean;
  photoId: string | null;
  onClose: () => void;
  onReported?: () => void;
}) {
  const [supabase] = useState(() => createClient());
  const [toast, setToast] = useState(false);

  async function handleReason(reason: string) {
    if (photoId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("reports")
          .insert({ photo_id: photoId, reporter_id: user.id, reason });
      }
    }
    onClose();
    onReported?.();
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/45"
          onClick={onClose}
        >
          <div
            className="flex w-full flex-col gap-2 rounded-t-[22px] bg-bg p-[18px] pb-[26px]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-1.5 text-center text-[15px] font-extrabold text-text">
              Signaler cette photo
            </p>
            {REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => handleReason(reason)}
                className="rounded-xl border border-border bg-bg-page px-3.5 py-3 text-left text-sm font-semibold text-text transition-colors hover:border-text-faint"
              >
                {reason}
              </button>
            ))}
            <button
              type="button"
              onClick={onClose}
              className="mt-1.5 rounded-xl py-3 text-sm font-bold text-text-muted"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
      {toast && (
        <div className="fixed left-1/2 top-4 z-[60] -translate-x-1/2 rounded-full bg-black/85 px-4 py-2 text-xs font-bold text-white">
          Signalement envoyé, merci.
        </div>
      )}
    </>
  );
}
