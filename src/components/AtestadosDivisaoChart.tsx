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
  LabelList,
} from "recharts";

interface AtestadosDivisaoChartProps {
  data: {
    divisao: string;
    total: number;
  }[];
  selectedDivisao?: string | null;
  onSelectDivisao?: (divisao: string) => void;
  temaDia?: boolean;
}

export function AtestadosDivisaoChart({
  data,
  selectedDivisao,
  onSelectDivisao,
  temaDia = false,
}: AtestadosDivisaoChartProps) {
  return (
    <div className="h-[380px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 92, bottom: 10 }}
        >
          <CartesianGrid
            horizontal={false}
            stroke={temaDia ? "#d7e7ee" : "#315b76"}
            strokeDasharray="3 3"
          />

          <XAxis
            type="number"
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: temaDia ? "#64748b" : "#94a3b8", fontSize: 12 }}
          />

          <YAxis
            type="category"
            dataKey="divisao"
            width={150}
            axisLine={false}
            tickLine={false}
            tick={{
              fill: temaDia ? "#334155" : "#cbd5e1",
              fontSize: 11,
              fontWeight: 700,
            }}
          />

          <Tooltip
            cursor={{ fill: temaDia ? "rgba(217,158,28,0.08)" : "rgba(251,191,36,0.08)" }}
            contentStyle={{
              background: temaDia ? "#ffffff" : "#163b5c",
              border: temaDia ? "1px solid #b9dbe8" : "1px solid #4381a7",
              borderRadius: 16,
              color: temaDia ? "#0f172a" : "#e2e8f0",
              boxShadow: temaDia ? "0 18px 45px rgba(15,23,42,0.12)" : "none",
            }}
            itemStyle={{ color: temaDia ? "#0f172a" : "#e2e8f0" }}
            labelStyle={{
              color: temaDia ? "#334155" : "#cbd5e1",
              fontWeight: 700,
            }}
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
            <LabelList
              dataKey="total"
              position="right"
              fill={temaDia ? "#8a5a00" : "#fde68a"}
              fontSize={12}
              fontWeight={800}
            />
            {data.map((item) => (
              <Cell
                key={item.divisao}
                fill={
                  selectedDivisao === item.divisao
                    ? "#fbbf24"
                    : "#d99e1c"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
