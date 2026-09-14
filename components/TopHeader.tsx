"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import NotificationBell from "./NotificationBell";

export default function TopHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const isSubScreen =
    pathname === "/parametres" || pathname === "/classement" || pathname.startsWith("/u/");

  if (isSubScreen) {
    const title =
      pathname === "/parametres" ? "Paramètres" : pathname === "/classement" ? "Classement de la semaine" : "Profil";
    return (
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Retour"
          title="Retour"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-page text-text-muted transition-colors hover:border-text-faint hover:text-text"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <span className="text-[17px] font-extrabold text-text">{title}</span>
        <span className="w-9" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border-b border-border px-5 py-4">
      <Link href="/rate" className="brand-text text-[19px]">
        Cote
      </Link>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <Link
          href="/parametres"
          aria-label="Paramètres"
          title="Paramètres"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-page text-text-muted transition-colors hover:border-text-faint hover:text-text"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
