"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Notif = {
  id: number;
  type: "new_fan" | "new_friend" | "weekly_leaderboard";
  count: number;
  is_read: boolean;
  created_at: string;
};

const ICONS: Record<Notif["type"], React.ReactNode> = {
  weekly_leaderboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10l-1 8a4 4 0 0 1-8 0z" />
      <path d="M5 4h2v4a5 5 0 0 1-5-5z" />
      <path d="M19 4h-2v4a5 5 0 0 0 5-5z" />
    </svg>
  ),
  new_friend: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  new_fan: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
};

function textFor(notif: Notif): { title: string; body: string } {
  if (notif.type === "new_friend") {
    return {
      title: notif.count > 1 ? `${notif.count} nouveaux amis` : "Nouvel ami",
      body:
        notif.count > 1
          ? `${notif.count} personnes sont devenues tes amies.`
          : "Une personne est devenue ton amie.",
    };
  }
  if (notif.type === "new_fan") {
    return {
      title: notif.count > 1 ? `${notif.count} nouveaux fans` : "Nouveau fan",
      body:
        notif.count > 1
          ? `${notif.count} personnes sont devenues fans de toi.`
          : "Une personne est devenue fan de toi.",
    };
  }
  return {
    title: "Classement de la semaine",
    body: "Le top 10 des photos publiées cette semaine, les mieux notées, est prêt à découvrir.",
  };
}

export default function NotificationBell() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const hasUnread = notifs.some((n) => !n.is_read);

  async function loadNotifs() {
    const { data } = await supabase
      .from("notifications")
      .select("id, type, count, is_read, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifs((data ?? []) as Notif[]);
  }

  useEffect(() => {
    loadNotifs();
  }, []);

  async function handleClick(notif: Notif) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", notif.id);
    setOpen(false);
    setNotifs((prev) => prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)));
    if (notif.type === "weekly_leaderboard") router.push("/classement");
    else if (notif.type === "new_friend") router.push("/profile?relations=amis");
    else if (notif.type === "new_fan") router.push("/profile?relations=fans");
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        title="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-page text-text-muted transition-colors hover:border-text-faint hover:text-text"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {hasUnread && (
          <span className="absolute right-[5px] top-[5px] h-2 w-2 rounded-full border-[1.5px] border-bg bg-red-500" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 max-h-96 w-72 overflow-y-auto rounded-2xl border border-border bg-bg shadow-xl">
            {notifs.length === 0 ? (
              <p className="p-6 text-center text-sm text-text-faint">Aucune notification pour l&apos;instant.</p>
            ) : (
              notifs.map((notif) => {
                const { title, body } = textFor(notif);
                return (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => handleClick(notif)}
                    className="flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-bg-page"
                  >
                    <span className="brand-gradient flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white">
                      {ICONS[notif.type]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-bold text-text">{title}</span>
                      <span className="block text-xs text-text-muted">{body}</span>
                    </span>
                    {!notif.is_read && (
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
