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
