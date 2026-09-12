"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Relance discrètement la vérification pour toute photo restée "en attente" —
// utile quand la vérification initiale a été interrompue (appli fermée,
// connexion coupée juste après la publication).
export default function PendingPhotoRetry({ photoIds }: { photoIds: string[] }) {
  const router = useRouter();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current || photoIds.length === 0) return;
    hasRun.current = true;

    (async () => {
      let changed = false;
      for (const id of photoIds) {
        try {
          const res = await fetch("/api/moderate-photo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photoId: id }),
          });
          const data = await res.json();
          if (data.status && data.status !== "pending") changed = true;
        } catch {
          // Pas grave : on retentera à la prochaine visite du profil.
        }
      }
      if (changed) router.refresh();
    })();
  }, [photoIds, router]);

  return null;
}
