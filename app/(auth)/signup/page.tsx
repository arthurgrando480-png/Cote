"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { traduireErreurAuth } from "@/lib/authErrors";

export default function SignupPage() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { pseudo: pseudo.trim() || email.split("@")[0] },
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : undefined,
      },
    });

    setLoading(false);

    if (error) {
      setError(traduireErreurAuth(error.message));
      return;
    }

    if (data.session) {
      router.push("/rate");
      router.refresh();
    } else {
      setCheckEmail(true);
    }
  }

  if (checkEmail) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-text">
          Vérifie ta boîte mail
        </h1>
        <p className="text-text-muted">
          On a envoyé un lien de confirmation à <strong>{email}</strong>.
          Clique dessus pour activer ton compte.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="text-center text-2xl font-extrabold tracking-tight text-text">
        Créer un compte
      </h1>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="pseudo" className="text-xs font-bold text-text-muted">
          Pseudo
        </label>
        <input
          id="pseudo"
          type="text"
          required
          maxLength={30}
          autoComplete="nickname"
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
          className="rounded-xl border border-border bg-bg-page px-3.5 py-3 text-text outline-none focus:border-brand-solid focus:bg-bg"
        />
      </div>

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
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-border bg-bg-page px-3.5 py-3 text-text outline-none focus:border-brand-solid focus:bg-bg"
        />
        <span className="text-xs text-text-faint">6 caractères minimum.</span>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="brand-gradient mt-2 rounded-full py-3 font-bold text-white shadow-[0_10px_20px_-4px_rgba(15,174,107,.32)] transition-opacity hover:opacity-90 disabled:opacity-40 disabled:shadow-none"
      >
        {loading ? "Création…" : "Créer mon compte"}
      </button>

      <p className="text-center text-sm text-text-muted">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-bold text-brand-solid">
          Connecte-toi
        </Link>
      </p>
    </form>
  );
}
