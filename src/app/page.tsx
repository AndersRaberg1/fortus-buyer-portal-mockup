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
