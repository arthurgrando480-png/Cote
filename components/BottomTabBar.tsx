"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/rate",
    label: "Noter",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    href: "/upload",
    label: "Publier",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profil",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
      </svg>
    ),
  },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="flex border-t border-border bg-bg px-2.5 pb-3 pt-2">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 flex-col items-center gap-1 py-1.5 text-[11px] font-bold ${
              active ? "text-brand-solid" : "text-text-faint"
            }`}
          >
            <span className="h-[22px] w-[22px]">{tab.icon}</span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
