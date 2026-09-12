import Link from "next/link";

const SCORES = Array.from({ length: 10 }, (_, i) => i + 1);

function greenShade(n: number) {
  const lightness = 20 + ((78 - 20) * (n - 1)) / 9;
  return `hsl(152, 60%, ${lightness.toFixed(0)}%)`;
}

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 px-4 py-16 text-center">
      <div className="flex flex-col items-center gap-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-text-faint">
          Bêta fermée
        </p>
        <h1 className="brand-text text-6xl sm:text-7xl">Cote</h1>
        <p className="max-w-sm text-text-muted">
          Une photo, un jury. Publie les tiennes, note celles des autres, et
          découvre ta cote — sans likes de complaisance.
        </p>
      </div>

      <div className="flex w-full max-w-[280px] overflow-hidden rounded-full shadow-[0_12px_26px_rgba(0,0,0,.25)]" aria-hidden="true">
        {SCORES.map((n) => (
          <span
            key={n}
            className="flex h-10 min-w-0 flex-1 items-center justify-center border-r border-black/[.18] text-sm font-extrabold text-white last:border-r-0"
            style={{
              background: `linear-gradient(to bottom, rgba(255,255,255,.24), rgba(255,255,255,0) 45%), ${greenShade(n)}`,
              textShadow: "0 1px 2px rgba(0,0,0,.35)",
            }}
          >
            {n}
          </span>
        ))}
      </div>

      <div className="flex gap-3">
        <Link
          href="/signup"
          className="brand-gradient rounded-full px-6 py-3 font-bold text-white shadow-[0_10px_20px_-4px_rgba(15,174,107,.32)] transition-opacity hover:opacity-90"
        >
          Créer un compte
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-border-strong px-6 py-3 font-bold text-text transition-colors hover:border-text-faint"
        >
          Se connecter
        </Link>
      </div>
    </div>
  );
}
