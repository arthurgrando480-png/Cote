"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { traduireErreurAuth } from "@/lib/authErrors";

export default function LoginPage() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError(traduireErreurAuth(error.message));
      return;
    }

    router.push("/rate");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="text-center text-2xl font-extrabold tracking-tight text-text">
        Connexion
      </h1>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs font-bold text-text-muted">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-border bg-bg-page px-3.5 py-3 text-text outline-none focus:border-brand-solid focus:bg-bg"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-xs font-bold text-text-muted">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-border bg-bg-page px-3.5 py-3 text-text outline-none focus:border-brand-solid focus:bg-bg"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="brand-gradient mt-2 rounded-full py-3 font-bold text-white shadow-[0_10px_20px_-4px_rgba(15,174,107,.32)] transition-opacity hover:opacity-90 disabled:opacity-40 disabled:shadow-none"
      >
        {loading ? "Connexion…" : "Se connecter"}
      </button>

      <p className="text-center text-sm text-text-muted">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="font-bold text-brand-solid">
          Inscris-toi
        </Link>
      </p>
    </form>
  );
}
