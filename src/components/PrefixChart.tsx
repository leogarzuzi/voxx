"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
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
        <BarChart data={data} margin={{ top: 28, right: 14, left: 0, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke={temaDia ? "#d7e8f0" : "rgba(185,219,234,0.14)"} />
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
              background: temaDia ? "#ffffff" : "#163b5c",
              border: `1px solid ${temaDia ? "#b9dbe8" : "#4381a7"}`,
              borderRadius: 16,
              color: temaDia ? "#102a43" : "#f4f8fb",
            }}
            itemStyle={{ color: temaDia ? "#0f172a" : "#e2e8f0" }}
            labelStyle={{ color: temaDia ? "#334155" : "#cbd5e1", fontWeight: 700 }}
          />
          <Bar
            dataKey="total"
            radius={[10, 10, 3, 3]}
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
                    ? "#45c2ef"
                    : "#159dce"
                }
              />
            ))}
            <LabelList dataKey="total" position="top" fill={temaDia ? "#173b63" : "#dceaf3"} fontSize={13} fontWeight={800} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
