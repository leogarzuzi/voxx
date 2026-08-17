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

interface DesligamentosMesChartProps {
  data: {
    mes: string;
    total: number;
  }[];
  selectedMes?: string | null;
  onSelectMes?: (mes: string) => void;
  temaDia?: boolean;
}

export function DesligamentosMesChart({
  data,
  selectedMes,
  onSelectMes,
  temaDia = false,
}: DesligamentosMesChartProps) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 28, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke={temaDia ? "#d7e7ee" : "#315b76"} strokeDasharray="3 3" />

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
            cursor={{ fill: temaDia ? "rgba(217,91,98,0.07)" : "rgba(251,113,133,0.08)" }}
            contentStyle={{
              background: temaDia ? "#ffffff" : "#163b5c",
              border: temaDia ? "1px solid #b9dbe8" : "1px solid #4381a7",
              borderRadius: 16,
              color: temaDia ? "#0f172a" : "#e2e8f0",
            }}
            itemStyle={{ color: temaDia ? "#0f172a" : "#e2e8f0" }}
            labelStyle={{ color: temaDia ? "#334155" : "#cbd5e1", fontWeight: 700 }}
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
            <LabelList
              dataKey="total"
              position="top"
              fill={temaDia ? "#991b1b" : "#fee2e2"}
              fontSize={12}
              fontWeight={800}
            />
            {data.map((item) => (
              <Cell
                key={item.mes}
                fill={
                  selectedMes === item.mes
                    ? "#fb7185"
                    : "#d95b62"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
