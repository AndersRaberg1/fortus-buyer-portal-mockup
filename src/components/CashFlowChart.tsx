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

// Beräkna prognos dynamiskt (total inkomst - utgift)
const totalInkomst = data.reduce((sum, d) => sum + d.inkomst, 0);
const totalUtgift = data.reduce((sum, d) => sum + d.utgift, 0);
const prognos = totalInkomst - totalUtgift;

export default function CashFlowChart() {
  return (
    <>
      <h2 className="text-2xl font-bold mb-4">Cash flow – kommande 30 dagar</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" label={{ value: 'Dag', position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: 'Belopp (kr)', angle: -90, position: 'insideLeft' }} />
          <Tooltip 
            formatter={(value: number | undefined) => 
              value !== undefined ? `${value.toLocaleString('sv-SE')} kr` : '0 kr'
            }
          />
          <Line type="monotone" dataKey="inkomst" stroke="#10b981" strokeWidth={3} name="Inkomst" />
          <Line type="monotone" dataKey="utgift" stroke="#ef4444" strokeWidth={3} name="Utgift" />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xl font-semibold mt-4 text-green-600">
        {prognos > 0 ? '+' : ''}{prognos.toLocaleString('sv-SE')} kr prognos
      </p>
    </>
  );
}
