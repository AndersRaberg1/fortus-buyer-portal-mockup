"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Hem", icon: "🏠" },
  { href: "/invoices", label: "Fakturor", icon: "📄" },
  { href: "/fortusflex", label: "FortusFlex", icon: "⏱️" },
  { href: "/analytics", label: "Analytics", icon: "📊" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobil bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 md:hidden flex justify-around py-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-center ${pathname === link.href ? "text-primary" : "text-gray-500"}`}
          >
            <div className="text-2xl">{link.icon}</div>
            <div className="text-xs">{link.label}</div>
          </Link>
        ))}
      </nav>

      {/* Desktop sidebar */}
      <nav className="hidden md:block fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 p-6">
        <h1 className="text-2xl font-bold mb-12 text-primary">Fortus</h1>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block py-3 px-4 rounded-lg mb-2 ${pathname === link.href ? "bg-primary text-white" : "hover:bg-gray-100 dark:hover:bg-gray-700"}`}
          >
            <span className="mr-3">{link.icon}</span> {link.label}
          </Link>
        ))}
      </nav>

      {/* Offset för desktop sidebar */}
      <div className="hidden md:block w-64" />
    </>
  );
}