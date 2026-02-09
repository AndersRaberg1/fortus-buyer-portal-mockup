"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { day: '1', inkomst: 40000, utgift: 30000 },
  { day: '5', inkomst: 45000, utgift: 35000 },
  { day: '10', inkomst: 50000, utgift: 28000 },
  { day: '15', inkomst: 55000, utgift: 40000 },
  { day: '20', inkomst: 60000, utgift: 32000 },
  { day: '25', inkomst: 65000, utgift: 38000 },
  { day: '30', inkomst: 70000, utgift: 35000 },
];

export default function CashFlowChart() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Cash flow – kommande 30 dagar</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip formatter={(value) => `${value.toLocaleString()} kr`} />
          <Line type="monotone" dataKey="inkomst" stroke="#10b981" strokeWidth={3} name="Inkomst" />
          <Line type="monotone" dataKey="utgift" stroke="#ef4444" strokeWidth={3} name="Utgift" />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-sm text-green-600 mt-4 font-medium">+120 000 kr prognos</p>
    </div>
  );
}