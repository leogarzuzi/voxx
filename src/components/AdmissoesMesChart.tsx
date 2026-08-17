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

interface AdmissoesMesChartProps {
  data: {
    mes: string;
    total: number;
  }[];
  selectedMes?: string | null;
  onSelectMes?: (mes: string) => void;
  temaDia?: boolean;
}

export function AdmissoesMesChart({
  data,
  selectedMes,
  onSelectMes,
  temaDia = false,
}: AdmissoesMesChartProps) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 28, right: 14, left: 0, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke={temaDia ? "#d7e8f0" : "rgba(185,219,234,0.14)"} />

          <XAxis
            dataKey="mes"
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
            formatter={(value) => [`${value}`, "Admissões"]}
            cursor={{ fill: temaDia ? "rgba(15,23,42,0.06)" : "rgba(148,163,184,0.08)" }}
            contentStyle={{
              background: temaDia ? "#ffffff" : "#163b5c",
              border: `1px solid ${temaDia ? "#b9dbe8" : "#4381a7"}`,
              borderRadius: 16,
              color: temaDia ? "#0f172a" : "#e2e8f0",
            }}
            itemStyle={{ color: temaDia ? "#0f172a" : "#e2e8f0" }}
            labelStyle={{ color: temaDia ? "#334155" : "#cbd5e1", fontWeight: 700 }}
          />

          <Bar
            dataKey="total"
            radius={[10, 10, 3, 3]}
            cursor={onSelectMes ? "pointer" : "default"}
            onClick={(item) => {
              const mes = item?.payload?.mes;
              if (mes) onSelectMes?.(String(mes));
            }}
          >
            {data.map((item) => (
              <Cell
                key={item.mes}
                fill={
                  selectedMes === item.mes
                    ? "#4ade80"
                    : "#2f965d"
                }
              />
            ))}
            <LabelList dataKey="total" position="top" fill={temaDia ? "#166534" : "#dcfce7"} fontSize={12} fontWeight={800} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
