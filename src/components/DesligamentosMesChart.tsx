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

interface DesligamentosMesChartProps {
  data: {
    mes: string;
    total: number;
  }[];
  selectedMes?: string | null;
  onSelectMes?: (mes: string) => void;
}

export function DesligamentosMesChart({
  data,
  selectedMes,
  onSelectMes,
}: DesligamentosMesChartProps) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(148,163,184,0.16)" strokeDasharray="3 3" />

          <XAxis
            dataKey="mes"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#cbd5e1", fontSize: 12, fontWeight: 700 }}
          />

          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
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
            formatter={(value) => [
              `${value}`,
              "Desligamentos",
            ]}
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
                    ? "#f87171"
                    : "rgba(248,113,113,0.72)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
