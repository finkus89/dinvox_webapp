"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import {
  formatMoney,
} from "@/lib/dinvox/expenses-utils";

type Props = {
  series: {
    monthKey: string;
    label: string;
    total: number;
  }[];
  monthDeltaPctByMonthKey: Record<string, number | null>;
  inProgressMonthKey: string;
  currency: string;
  language?: string;
  lineColor?: string;
};

export default function MonthlyEvolutionLineChart({
  series,
  monthDeltaPctByMonthKey,
  inProgressMonthKey,
  currency,
  language = "es-CO",
  lineColor,
}: Props) {

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload;

    const delta = monthDeltaPctByMonthKey[data.monthKey];

    const currentIndex = series.findIndex(
      (m) => m.monthKey === data.monthKey
    );
    const prevLabel =
      currentIndex > 0 ? series[currentIndex - 1].label : null;

    return (
      <div
        style={{
          background: "rgba(15,23,42,0.95)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 12,
          padding: "10px 12px",
          color: "#fff",
          fontSize: 12,
          lineHeight: 1.4,
          maxWidth: 200,
        }}
      >
        <div style={{ fontWeight: 600 }}>{data.label}</div>

        <div>
          {formatMoney(Number(data.total), currency, language)}
        </div>

        {delta != null && prevLabel && (
          <div style={{ opacity: 0.85 }}>
            vs {prevLabel}: {delta > 0 ? "+" : ""}
            {delta.toFixed(0)}%
          </div>
        )}

        {data.monthKey === inProgressMonthKey && (
          <div style={{ marginTop: 4, opacity: 0.7 }}>
            Mes en curso
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={series}
          margin={{ top: 12, right: 12, bottom: 8, left: 14 }}
        >
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />

          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "rgba(255,255,255,0.75)" }}
            tickMargin={10}
            axisLine={{ stroke: "rgba(255,255,255,0.25)" }}
            tickLine={{ stroke: "rgba(255,255,255,0.25)" }}
            interval="preserveStartEnd"
          />

          <YAxis
            width={100}
            tick={{ fontSize: 12, fill: "rgba(255,255,255,0.75)" }}
            tickMargin={10}
            axisLine={{ stroke: "rgba(255,255,255,0.25)" }}
            tickLine={{ stroke: "rgba(255,255,255,0.25)" }}
            tickFormatter={(v) =>
              formatMoney(Number(v), currency, language)
            }
          />

          <Tooltip content={<CustomTooltip />} />

          <Line
            type="linear"
            dataKey="total"
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            stroke={lineColor ?? "rgba(255,255,255,0.90)"}
            strokeWidth={2.4}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
