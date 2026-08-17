"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";

interface TurnoverChartProps {
  temaDia?: boolean;
  data: {
    mes: string;
    turnover: number;
  }[];
}

export function TurnoverChart({ data, temaDia = false }: TurnoverChartProps) {
  // ALTERE AQUI A META DO TURNOVER
  const metaTurnover = 5;
  const limiteEixo = Math.max(6, Math.ceil(Math.max(...data.map((item) => item.turnover), 0) + 1));

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
        >
          <CartesianGrid stroke={temaDia ? "rgba(15,23,42,0.12)" : "rgba(148,163,184,0.16)"} strokeDasharray="3 3" />

          <XAxis
            dataKey="mes"
            axisLine={false}
            tickLine={false}
            tick={{ fill: temaDia ? "#475569" : "#cbd5e1", fontSize: 12, fontWeight: 700 }}
          />

          <YAxis
            type="number"
            domain={[0, limiteEixo]}
            tickFormatter={(value) => `${value}%`}
            axisLine={false}
            tickLine={false}
            tick={{ fill: temaDia ? "#64748b" : "#94a3b8", fontSize: 12 }}
          />

          <Tooltip
            formatter={(value) => [`${value}%`, "Turnover"]}
            contentStyle={{
              background: temaDia ? "#ffffff" : "#163b5c",
              border: `1px solid ${temaDia ? "#b9dbe8" : "#4381a7"}`,
              borderRadius: 16,
              color: temaDia ? "#102a43" : "#f4f8fb",
            }}
            itemStyle={{ color: temaDia ? "#0f172a" : "#e2e8f0" }}
            labelStyle={{ color: temaDia ? "#334155" : "#cbd5e1", fontWeight: 700 }}
            cursor={{ stroke: temaDia ? "rgba(15,23,42,0.22)" : "rgba(96,165,250,0.28)" }}
          />

          <ReferenceLine
            y={metaTurnover}
            stroke="#f87171"
            strokeWidth={2}
            strokeDasharray="6 6"
            label={{
              value: "Meta 5%",
              position: "right",
              fill: "#fca5a5",
              fontSize: 12,
            }}
          />

          <Line
            type="monotone"
            dataKey="turnover"
            stroke="#35b5e5"
            strokeWidth={3}
            dot={{ r: 4, fill: "#35b5e5", stroke: temaDia ? "#ffffff" : "#163b5c", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "#6dd0f3", stroke: temaDia ? "#ffffff" : "#163b5c", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
