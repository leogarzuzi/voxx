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

interface DesligamentosMesChartProps {
  data: {
    mes: string;
    total: number;
  }[];
}

export function DesligamentosMesChart({
  data,
}: DesligamentosMesChartProps) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" />
          <YAxis allowDecimals={false} />
          <Tooltip
            formatter={(value) => [
              `${value}`,
              "Desligamentos",
            ]}
          />
          <Bar
            dataKey="total"
            fill="#dc2626"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
