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
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="mes" />

          <YAxis
            type="number"
            domain={[0, 6]}
            ticks={[0, 1, 2, 3, 4, 5, 6]}
            tickFormatter={(value) => `${value}%`}
          />

          <Tooltip
            formatter={(value: number) => [`${value}%`, "Turnover"]}
          />

          <ReferenceLine
            y={metaTurnover}
            stroke="#dc2626"
            strokeWidth={2}
            strokeDasharray="6 6"
            label={{
              value: "Meta 5%",
              position: "right",
              fill: "#dc2626",
              fontSize: 12,
            }}
          />

          <Line
            type="monotone"
            dataKey="turnover"
            stroke="#2563eb"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}