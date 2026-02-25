"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home", icon: "\u{1F3E0}" },
  { href: "/apply", label: "Apply", icon: "\u{1F48A}" },
  { href: "/simulator", label: "E2 Sim", icon: "\u{1F4C8}" },
  { href: "/history", label: "History", icon: "\u{1F4CB}" },
  { href: "/settings", label: "Settings", icon: "\u2699\uFE0F" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16 max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 transition-all ${
                isActive
                  ? "text-kawaii-pink-dark scale-110"
                  : "text-gray-400 hover:text-kawaii-pink"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
