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

type DivisionChartProps = {
  data: {
    divisao: string;
    total: number;
  }[];
  selectedDivisao?: string | null;
  onSelectDivisao?: (divisao: string) => void;
  temaDia?: boolean;
  corBase?: string;
  corAtiva?: string;
};

export function DivisionChart({
  data,
  selectedDivisao,
  onSelectDivisao,
  temaDia = false,
  corBase = "#159dce",
  corAtiva = "#45c2ef",
}: DivisionChartProps) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 6, right: 42, left: 18, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke={temaDia ? "#d7e8f0" : "rgba(185,219,234,0.14)"} />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            tick={{ fill: temaDia ? "#60758a" : "#bfd0dc", fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="divisao"
            width={105}
            axisLine={false}
            tickLine={false}
            tick={{ fill: temaDia ? "#173b63" : "#dceaf3", fontSize: 11, fontWeight: 700 }}
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
            radius={[0, 10, 10, 0]}
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
                    ? corAtiva
                    : corBase
                }
              />
            ))}
            <LabelList dataKey="total" position="right" fill={temaDia ? "#173b63" : "#dceaf3"} fontSize={12} fontWeight={800} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
