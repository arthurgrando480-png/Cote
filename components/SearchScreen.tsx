"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type UserResult = { id: string; pseudo: string; avatar_url: string | null };

export default function SearchScreen({ currentUserId }: { currentUserId: string }) {
  const [supabase] = useState(() => createClient());
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      let request = supabase
        .from("profiles")
        .select("id, pseudo, avatar_url")
        .neq("id", currentUserId)
        .order("pseudo")
        .limit(30);

      if (query.trim()) {
        request = request.ilike("pseudo", `%${query.trim()}%`);
      }

      const { data } = await request;
      if (!cancelled) {
        setResults((data ?? []) as UserResult[]);
        setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, supabase, currentUserId]);

  return (
    <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-4">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-page px-3.5 py-2.5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] flex-shrink-0 text-text-faint">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Chercher un pseudo..."
          className="w-full border-none bg-transparent text-sm text-text outline-none placeholder:text-text-faint"
        />
      </div>

      <div className="flex flex-col gap-0.5">
        {!loading && results.length === 0 && (
          <p className="py-6 text-center text-sm text-text-faint">
            Aucun pseudo ne correspond.
          </p>
        )}
        {results.map((user) => (
          <Link
            key={user.id}
            href={`/u/${user.id}`}
            className="flex items-center gap-3 rounded-xl px-1 py-2.5 transition-colors hover:bg-bg-page"
          >
            <span
              className="h-[42px] w-[42px] flex-shrink-0 rounded-full border border-border bg-bg-page bg-cover bg-center brand-gradient"
              style={
                user.avatar_url ? { backgroundImage: `url(${user.avatar_url})` } : undefined
              }
            />
            <span className="text-sm font-bold text-text">{user.pseudo}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
