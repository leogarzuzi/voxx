"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface AtestadosDivisaoChartProps {
  data: {
    divisao: string;
    total: number;
  }[];
}

export function AtestadosDivisaoChart({
  data,
}: AtestadosDivisaoChartProps) {
  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis type="number" allowDecimals={false} />

          <YAxis
            type="category"
            dataKey="divisao"
            width={140}
          />

          <Tooltip
            formatter={(value) => [`${value}`, "Atestados"]}
          />

          <Bar
            dataKey="total"
            fill="#7c3aed"
            radius={[0, 6, 6, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}