import Link from "next/link";
import Image from "next/image";

const DEMO_SCORES = Array.from({ length: 10 }, (_, i) => i + 1);

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

      <div
        className="flex flex-wrap items-end justify-center gap-1.5"
        aria-hidden="true"
      >
        {DEMO_SCORES.map((n) => (
          <div
            key={n}
            className={`relative h-13 w-10 transition-transform ${
              n === 7 ? "-translate-y-1 scale-[1.18]" : ""
            }`}
            style={{ height: "52px" }}
          >
            <Image src={`/orbs/ball-${n}.png`} alt="" fill sizes="40px" className="object-contain" />
          </div>
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
