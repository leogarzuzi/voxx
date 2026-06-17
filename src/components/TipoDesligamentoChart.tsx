"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

interface TipoDesligamentoChartProps {
  data: {
    name: string;
    value: number;
  }[];
  selectedTipo?: string | null;
  onSelectTipo?: (tipo: string) => void;
  temaDia?: boolean;
}

const COLORS = [
  "#60a5fa",
  "#f87171",
  "#34d399",
  "#a78bfa",
  "#fb923c",
  "#22d3ee",
];

export function TipoDesligamentoChart({
  data,
  selectedTipo,
  onSelectTipo,
  temaDia = false,
}: TipoDesligamentoChartProps) {
  return (
    <div className="h-[440px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 12, right: 20, bottom: 28, left: 20 }}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={76}
            outerRadius={126}
            paddingAngle={3}
            stroke={temaDia ? "#ffffff" : "#171a23"}
            strokeWidth={3}
            cursor={onSelectTipo ? "pointer" : "default"}
            onClick={(item) => {
              const tipo = item?.name;
              if (tipo) onSelectTipo?.(String(tipo));
            }}
          >
            {data.map((item, index) => (
              <Cell
                key={item.name}
                fill={COLORS[index % COLORS.length]}
                opacity={!selectedTipo || selectedTipo === item.name ? 1 : 0.32}
              />
            ))}
          </Pie>

          <Tooltip
            formatter={(value) => [`${value}`, "Desligamentos"]}
            contentStyle={{
              background: temaDia ? "#ffffff" : "#171a23",
              border: temaDia ? "1px solid rgba(15,23,42,0.12)" : "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              color: temaDia ? "#0f172a" : "#e2e8f0",
            }}
            itemStyle={{ color: temaDia ? "#0f172a" : "#e2e8f0" }}
            labelStyle={{ color: temaDia ? "#334155" : "#cbd5e1", fontWeight: 700 }}
          />
          <Legend
            verticalAlign="bottom"
            height={72}
            iconType="circle"
            wrapperStyle={{
              color: temaDia ? "#475569" : "#cbd5e1",
              fontSize: 12,
              paddingTop: 16,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
