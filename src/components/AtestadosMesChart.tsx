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

interface AtestadosMesChartProps {
  data: {
    mes: string;
    total: number;
  }[];
}

export function AtestadosMesChart({
  data,
}: AtestadosMesChartProps) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="mes" />

          <YAxis allowDecimals={false} />

          <Tooltip
            formatter={(value) => [
              value,
              "Atestados",
            ]}
          />

          <Bar
            dataKey="total"
            fill="#7c3aed"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}