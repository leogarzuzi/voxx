"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
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
  selectedDivisao?: string | null;
  onSelectDivisao?: (divisao: string) => void;
}

export function AtestadosDivisaoChart({
  data,
  selectedDivisao,
  onSelectDivisao,
}: AtestadosDivisaoChartProps) {
  return (
    <div className="h-[380px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 92, bottom: 10 }}
        >
          <CartesianGrid stroke="rgba(148,163,184,0.16)" strokeDasharray="3 3" />

          <XAxis
            type="number"
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
          />

          <YAxis
            type="category"
            dataKey="divisao"
            width={150}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#cbd5e1", fontSize: 11, fontWeight: 700 }}
          />

          <Tooltip
            cursor={{ fill: "rgba(148,163,184,0.08)" }}
            contentStyle={{
              background: "#171a23",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              color: "#e2e8f0",
            }}
            itemStyle={{ color: "#e2e8f0" }}
            labelStyle={{ color: "#cbd5e1", fontWeight: 700 }}
            formatter={(value) => [`${value}`, "Atestados"]}
          />

          <Bar
            dataKey="total"
            radius={[0, 12, 12, 0]}
            cursor={onSelectDivisao ? "pointer" : "default"}
            onClick={(item) => {
              const divisao = item?.payload?.divisao;
              if (divisao) onSelectDivisao?.(String(divisao));
            }}
          >
            {data.map((item) => (
              <Cell
                key={item.divisao}
                fill={
                  selectedDivisao === item.divisao
                    ? "#c084fc"
                    : "rgba(192,132,252,0.72)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
