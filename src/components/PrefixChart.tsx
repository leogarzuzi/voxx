"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type PrefixChartProps = {
  data: {
    prefixo: string;
    total: number;
  }[];
  selectedPrefixo?: string | null;
  onSelectPrefixo?: (prefixo: string) => void;
  temaDia?: boolean;
};

export function PrefixChart({
  data,
  selectedPrefixo,
  onSelectPrefixo,
  temaDia = false,
}: PrefixChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="prefixo"
            axisLine={false}
            tickLine={false}
            tick={{ fill: temaDia ? "#475569" : "#cbd5e1", fontSize: 12, fontWeight: 700 }}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: temaDia ? "#64748b" : "#94a3b8", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: temaDia ? "rgba(15,23,42,0.06)" : "rgba(148,163,184,0.08)" }}
            contentStyle={{
              background: "#171a23",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              color: "#e2e8f0",
            }}
            itemStyle={{ color: temaDia ? "#0f172a" : "#e2e8f0" }}
            labelStyle={{ color: temaDia ? "#334155" : "#cbd5e1", fontWeight: 700 }}
          />
          <Bar
            dataKey="total"
            radius={[12, 12, 4, 4]}
            cursor={onSelectPrefixo ? "pointer" : "default"}
            onClick={(item) => {
              const prefixo = item?.payload?.prefixo;
              if (prefixo) onSelectPrefixo?.(String(prefixo));
            }}
          >
            {data.map((item) => (
              <Cell
                key={item.prefixo}
                fill={
                  selectedPrefixo === item.prefixo
                    ? "#60a5fa"
                    : "rgba(148,163,184,0.68)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
