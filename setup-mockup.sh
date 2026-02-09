#!/bin/bash

set -e

echo "🚀 Startar automatisk setup av Buyer Portal mockup..."

mkdir -p src/components

cat > src/app/globals.css << 'EOL'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100;
}
EOL

cat > tailwind.config.ts << 'EOL'
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
      },
    },
  },
  plugins: [],
  darkMode: "class",
};
export default config;
EOL

cat > src/app/layout.tsx << 'EOL'
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fortus Buyer Portal",
  description: "Mockup",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body className={\`\${inter.className} min-h-screen\`}>
        {children}
        <Navigation />
      </body>
    </html>
  );
}
EOL

cat > src/app/page.tsx << 'EOL'
"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:from-gray-900">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full">
        <h1 className="text-3xl font-bold mb-8">Fortus Buyer Portal</h1>
        <button
          onClick={() => router.push("/dashboard")}
          className="bg-primary text-white px-8 py-4 rounded-lg text-lg font-medium hover:opacity-90"
        >
          Logga in med BankID (mock)
        </button>
      </div>
    </main>
  );
}
EOL

mkdir -p src/app/dashboard
cat > src/app/dashboard/page.tsx << 'EOL'
import CreditCard from "@/components/CreditCard";
import CashFlowChart from "@/components/CashFlowChart";

export default function Dashboard() {
  return (
    <div className="p-6 max-w-4xl mx-auto pb-20 md:pb-6">
      <h2 className="text-2xl font-bold mb-6">Hej, Företag AB!</h2>
      
      <CreditCard />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <p className="text-gray-500 dark:text-gray-400">Kommande betalningar</p>
          <p className="text-3xl font-bold">320 000 kr</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <p className="text-gray-500 dark:text-gray-400">Purchasing power</p>
          <p className="text-3xl font-bold text-green-600">980 000 kr</p>
        </div>
      </div>

      <CashFlowChart />

      <button className="w-full bg-primary text-white py-4 rounded-lg font-medium mt-8">
        Ladda upp ny faktura
      </button>
    </div>
  );
}
EOL

mkdir -p src/app/invoices
cat > src/app/invoices/page.tsx << 'EOL'
export default function Invoices() {
  return (
    <div className="p-6 max-w-4xl mx-auto pb-20 md:pb-6">
      <h2 className="text-2xl font-bold mb-6">Fakturor & ordrar</h2>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 mb-8 text-center border-2 border-dashed">
        <p className="text-gray-500">Dra och släpp faktura här</p>
        <button className="mt-4 bg-primary text-white px-6 py-3 rounded-lg">Välj fil</button>
      </div>

      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex justify-between items-center">
          <div>
            <p className="font-medium">Faktura #12345</p>
            <p className="text-sm text-gray-500">450 000 kr – 15 mars</p>
          </div>
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Godkänd</span>
        </div>
      </div>
    </div>
  );
}
EOL

mkdir -p src/app/fortusflex
cat > src/app/fortusflex/page.tsx << 'EOL'
import FeeCalculator from "@/components/FeeCalculator";

export default function FortusFlex() {
  return (
    <div className="p-6 max-w-4xl mx-auto pb-20 md:pb-6">
      <h2 className="text-2xl font-bold mb-6">FortusFlex</h2>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8">
        <p className="font-medium mb-6">Ladda upp leverantörsfaktura</p>
        <div className="border-2 border-dashed rounded-xl p-12 text-center mb-8">
          <p className="text-gray-500">Dra och släpp PDF</p>
        </div>

        <FeeCalculator />

        <button className="w-full bg-primary text-white py-4 rounded-lg font-medium mt-8">
          Signera med BankID
        </button>
      </div>
    </div>
  );
}
EOL

mkdir -p src/app/analytics
cat > src/app/analytics/page.tsx << 'EOL'
export default function Analytics() {
  return (
    <div className="p-6 max-w-4xl mx-auto pb-20 md:pb-6">
      <h2 className="text-2xl font-bold mb-6">Analytics</h2>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6">
        <h3 className="font-semibold mb-4">Spend per leverantör</h3>
        <div className="bg-gray-200 dark:bg-gray-700 border-2 border-dashed rounded-xl h-64 flex items-center justify-center">
          <p className="text-gray-500">Interaktiv graf här (Recharts i produktion)</p>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
        <p className="font-medium text-primary">AI-insikt</p>
        <p>Du kan spara ca 45 000 kr genom FortusFlex denna månad.</p>
      </div>
    </div>
  );
}
EOL

cat > src/components/Navigation.tsx << 'EOL'
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
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 md:hidden flex justify-around py-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={\`text-center \${pathname === link.href ? "text-primary" : "text-gray-500"}\`}
          >
            <div className="text-2xl">{link.icon}</div>
            <div className="text-xs">{link.label}</div>
          </Link>
        ))}
      </nav>

      <nav className="hidden md:block fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 p-6">
        <h1 className="text-2xl font-bold mb-12">Fortus</h1>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={\`block py-3 px-4 rounded-lg mb-2 \${pathname === link.href ? "bg-primary text-white" : "hover:bg-gray-100 dark:hover:bg-gray-700"}\`}
          >
            {link.icon} {link.label}
          </Link>
        ))}
      </nav>
      
      <div className="hidden md:block w-64" />
    </>
  );
}
EOL

cat > src/components/CreditCard.tsx << 'EOL'
export default function CreditCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center">
      <p className="text-gray-500 dark:text-gray-400 text-sm">Tillgänglig kredit</p>
      <p className="text-5xl font-bold text-primary my-4">1 250 000 kr</p>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6">
        <div className="bg-primary h-6 rounded-full" style={{ width: "75%" }} />
      </div>
      <p className="text-sm text-gray-500 mt-4">av total limit 1 500 000 kr</p>
    </div>
  );
}
EOL

cat > src/components/CashFlowChart.tsx << 'EOL'
export default function CashFlowChart() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
      <h3 className="font-semibold mb-4">Cash flow – kommande 30 dagar</h3>
      <div className="bg-gray-200 dark:bg-gray-700 border-2 border-dashed rounded-xl h-64 flex items-center justify-center">
        <p className="text-gray-500">Placeholder-graf (lägg till Recharts senare)</p>
      </div>
    </div>
  );
}
EOL

cat > src/components/FeeCalculator.tsx << 'EOL'
"use client";

import { useState } from "react";

export default function FeeCalculator() {
  const [days, setDays] = useState(30);

  const fee = days <= 30 ? 10000 : 10000 + (days - 30) * 500;

  return (
    <div>
      <label className="block mb-6">
        <span className="font-medium">Välj förlängning</span>
        <input
          type="range"
          min="15"
          max="90"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="w-full mt-3"
        />
        <p className="text-center text-2xl font-bold mt-3">{days} dagar</p>
      </label>

      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 text-center">
        <p className="font-medium">Beräknad kostnad</p>
        <p className="text-4xl font-bold text-primary">{fee.toLocaleString()} kr</p>
        <p className="text-sm text-gray-500 mt-2">ca {(fee / 1000000 * 100).toFixed(2)}% av belopp</p>
      </div>
    </div>
  );
}
EOL

echo "✅ Alla filer är klara!"
echo "Starta om servern med: npm run dev"
