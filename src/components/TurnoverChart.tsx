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
  data: {
    mes: string;
    turnover: number;
  }[];
}

export function TurnoverChart({ data }: TurnoverChartProps) {
  // ALTERE AQUI A META DO TURNOVER
  const metaTurnover = 5;

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
        >
          <CartesianGrid stroke="rgba(148,163,184,0.16)" strokeDasharray="3 3" />

          <XAxis
            dataKey="mes"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#cbd5e1", fontSize: 12, fontWeight: 700 }}
          />

          <YAxis
            type="number"
            domain={[0, 6]}
            ticks={[0, 1, 2, 3, 4, 5, 6]}
            tickFormatter={(value) => `${value}%`}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
          />

          <Tooltip
            formatter={(value) => [`${value}%`, "Turnover"]}
            contentStyle={{
              background: "#171a23",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              color: "#e2e8f0",
            }}
            itemStyle={{ color: "#e2e8f0" }}
            labelStyle={{ color: "#cbd5e1", fontWeight: 700 }}
            cursor={{ stroke: "rgba(96,165,250,0.28)" }}
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
            stroke="#60a5fa"
            strokeWidth={3}
            dot={{ r: 4, fill: "#60a5fa", stroke: "#172033", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "#93c5fd", stroke: "#172033", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
