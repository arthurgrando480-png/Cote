import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4">
      <Link href="/" className="brand-text text-2xl">
        Cote
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
