import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Cote",
  description: "Publie tes photos, note celles des autres, découvre ta cote.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={jakarta.variable}>
      <body className="bg-bg-page">
        <div className="mx-auto min-h-dvh w-full max-w-[480px] bg-bg">
          {children}
        </div>
      </body>
    </html>
  );
}
