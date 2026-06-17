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

interface AtestadosMesChartProps {
  data: {
    mes: string;
    total: number;
  }[];
  selectedMes?: string | null;
  onSelectMes?: (mes: string) => void;
  temaDia?: boolean;
}

export function AtestadosMesChart({
  data,
  selectedMes,
  onSelectMes,
  temaDia = false,
}: AtestadosMesChartProps) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid
            stroke={temaDia ? "rgba(71,85,105,0.16)" : "rgba(148,163,184,0.16)"}
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="mes"
            axisLine={false}
            tickLine={false}
            tick={{
              fill: temaDia ? "#334155" : "#cbd5e1",
              fontSize: 12,
              fontWeight: 700,
            }}
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
              background: temaDia ? "#ffffff" : "#171a23",
              border: temaDia
                ? "1px solid rgba(203,213,225,0.95)"
                : "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              color: temaDia ? "#0f172a" : "#e2e8f0",
              boxShadow: temaDia ? "0 18px 45px rgba(15,23,42,0.12)" : "none",
            }}
            itemStyle={{ color: temaDia ? "#0f172a" : "#e2e8f0" }}
            labelStyle={{
              color: temaDia ? "#334155" : "#cbd5e1",
              fontWeight: 700,
            }}
            formatter={(value) => [value, "Atestados"]}
          />

          <Bar
            dataKey="total"
            radius={[12, 12, 4, 4]}
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
                    ? temaDia
                      ? "#0f172a"
                      : "#c084fc"
                    : temaDia
                      ? "rgba(71,85,105,0.72)"
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
