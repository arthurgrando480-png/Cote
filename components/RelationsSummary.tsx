"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Person = { id: string; pseudo: string; avatar_url: string | null };
type Tab = "amis" | "fans" | "fande";

const TAB_LABELS: Record<Tab, string> = { amis: "Amis", fans: "Fans", fande: "Fan de" };

export default function RelationsSummary({ userId }: { userId: string }) {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const searchParams = useSearchParams();
  const [counts, setCounts] = useState({ amis: 0, fans: 0, fande: 0 });
  const [openTab, setOpenTab] = useState<Tab | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  async function loadCounts() {
    const [friendRes, fansRes, fandeRes] = await Promise.all([
      supabase.rpc("get_friend_ids", { u: userId }),
      supabase.from("fans").select("fan_id", { count: "exact", head: true }).eq("target_id", userId),
      supabase.from("fans").select("target_id", { count: "exact", head: true }).eq("fan_id", userId),
    ]);
    setCounts({
      amis: (friendRes.data ?? []).length,
      fans: fansRes.count ?? 0,
      fande: fandeRes.count ?? 0,
    });
  }

  useEffect(() => {
    loadCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const param = searchParams.get("relations");
    if (param === "amis" || param === "fans" || param === "fande") {
      openList(param);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function openList(tab: Tab) {
    setOpenTab(tab);
    setLoadingList(true);

    let ids: string[] = [];
    if (tab === "amis") {
      const { data } = await supabase.rpc("get_friend_ids", { u: userId });
      ids = (data ?? []).map((r: { friend_id: string }) => r.friend_id);
    } else if (tab === "fans") {
      const { data } = await supabase.from("fans").select("fan_id").eq("target_id", userId);
      ids = (data ?? []).map((r) => r.fan_id as string);
    } else {
      const { data } = await supabase.from("fans").select("target_id").eq("fan_id", userId);
      ids = (data ?? []).map((r) => r.target_id as string);
    }

    if (ids.length === 0) {
      setPeople([]);
      setLoadingList(false);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, pseudo, avatar_url")
      .in("id", ids);
    setPeople((profiles ?? []) as Person[]);
    setLoadingList(false);
  }

  function close() {
    setOpenTab(null);
    router.replace("/profile");
  }

  return (
    <>
      <div className="flex justify-center gap-7 px-5">
        {(["amis", "fans", "fande"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => openList(tab)}
            className="flex flex-col items-center text-xs font-semibold text-text-muted"
          >
            <strong className="text-base font-extrabold text-text">{counts[tab]}</strong>
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {openTab && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-bg">
          <div className="flex items-center justify-between p-3.5">
            <button
              type="button"
              onClick={close}
              aria-label="Fermer"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-page text-text-muted"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="flex gap-1.5 border-b border-border px-4 pb-2.5">
            {(["amis", "fans", "fande"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => openList(tab)}
                className={`flex-1 border-b-2 pb-2 text-sm font-bold transition-colors ${
                  openTab === tab ? "border-brand-solid text-brand-solid" : "border-transparent text-text-faint"
                }`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-2">
            {loadingList ? (
              <p className="py-10 text-center text-sm text-text-faint">Chargement…</p>
            ) : people.length === 0 ? (
              <p className="py-10 text-center text-sm text-text-faint">Personne pour l&apos;instant.</p>
            ) : (
              people.map((p) => (
                <Link
                  key={p.id}
                  href={`/u/${p.id}`}
                  className="flex items-center gap-3 rounded-xl px-1 py-2.5 transition-colors hover:bg-bg-page"
                >
                  <span
                    className="h-10 w-10 flex-shrink-0 rounded-full border border-border bg-bg-page bg-cover bg-center brand-gradient"
                    style={p.avatar_url ? { backgroundImage: `url(${p.avatar_url})` } : undefined}
                  />
                  <span className="text-sm font-bold text-text">{p.pseudo}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
