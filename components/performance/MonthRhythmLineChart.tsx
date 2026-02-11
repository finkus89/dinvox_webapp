"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

import type { MonthPaceChartPoint } from "@/lib/analytics/pace";
import { formatMoney } from "@/lib/dinvox/expenses-utils";

type Props = {
  data: MonthPaceChartPoint[];
  currency: string;
  language?: string;
};

export default function MonthRhythmLineChart({ data, currency, language }: Props) {
  const hasBaseline = (data ?? []).some((d) => typeof d.baseline === "number");
  const lang = language ?? "es-CO";

  return (
    <div className="w-full h-56 sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, bottom: 8, left: 14 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />

          <XAxis
            dataKey="day"
            tick={{ fontSize: 12, fill: "rgba(255,255,255,0.75)" }}
            tickMargin={10}
            axisLine={{ stroke: "rgba(255,255,255,0.25)" }}
            tickLine={{ stroke: "rgba(255,255,255,0.25)" }}
            interval="preserveStartEnd"
          />

          <YAxis
            width={92}
            tick={{ fontSize: 12, fill: "rgba(255,255,255,0.75)" }}
            tickMargin={10}
            axisLine={{ stroke: "rgba(255,255,255,0.25)" }}
            tickLine={{ stroke: "rgba(255,255,255,0.25)" }}
            tickFormatter={(v) => formatMoney(Number(v), currency, lang)}
          />

          <Tooltip
            contentStyle={{
              background: "rgba(15,23,42,0.92)",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 12,
              color: "rgba(255,255,255,0.92)",
            }}
            labelStyle={{ color: "rgba(255,255,255,0.85)" }}
            formatter={(value: any, name: string) => {
              const n = Number(value);
              const label = name === "baseline" ? "Referencia" : "Actual";
              return [formatMoney(n, currency, lang), label];
            }}
            labelFormatter={(label) => `Día ${label}`}
          />

          <Legend
            verticalAlign="top"
            align="left"
            formatter={(value) => (
              <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                {value === "baseline" ? "Referencia" : "Actual"}
              </span>
            )}
          />

          <Line
            type="monotone"
            dataKey="actual"
            name="actual"
            dot={false}
            stroke="rgba(255,255,255,0.90)"
            strokeWidth={2.4}
            isAnimationActive={false}
          />

          {hasBaseline && (
            <Line
              type="monotone"
              dataKey="baseline"
              name="baseline"
              dot={false}
              stroke="rgba(255,255,255,0.45)"
              strokeWidth={2.2}
              strokeDasharray="7 5"
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
