// src/components/performance/MonthlyEvolutionLineChart.tsx
// -----------------------------------------------------------------------------
// Dinvox | Chart: Evolución mensual (línea)
//
// Objetivo:
// - Mostrar el total mensual (o por categoría filtrada) mes a mes.
// - Tooltip con:
//    • Total del mes (formateado con moneda/locale reales)
//    • Delta % vs mes anterior (si existe)
//    • Indicador "Mes en curso" cuando aplica
//
// Decisiones UX:
// - Eje Y en formato compacto (K / M) para evitar saturación visual.
// - Badge visible con la moneda (COP / EUR / USD) para que el usuario no dependa
//   del símbolo en el eje.
//
// Notas técnicas:
// - NO hace fetch: solo renderiza datos recibidos por props.
// - Precalcula indexByMonthKey para que el tooltip no haga findIndex en cada hover.
// -----------------------------------------------------------------------------

"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { formatMoney } from "@/lib/dinvox/expenses-utils";

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

// -----------------------
// Helpers UI
// -----------------------

// Formato compacto para eje Y (K / M) sin moneda para evitar ruido visual.
// La moneda se muestra en un badge arriba + en tooltip con formatMoney().
function formatCompactNumber(value: number, language: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";

  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`;

  return new Intl.NumberFormat(language, { maximumFractionDigits: 0 }).format(n);
}

export default function MonthlyEvolutionLineChart({
  series,
  monthDeltaPctByMonthKey,
  inProgressMonthKey,
  currency,
  language = "es-CO",
  lineColor,
}: Props) {
  // Mapa para lookup rápido del mes anterior (evita findIndex en cada hover)
  const indexByMonthKey = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = 0; i < (series ?? []).length; i++) {
      map[series[i].monthKey] = i;
    }
    return map;
  }, [series]);

  // Tooltip custom (usa formatMoney para mostrar moneda real)
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;

    const point = payload[0]?.payload as {
      monthKey: string;
      label: string;
      total: number;
    };

    const delta = monthDeltaPctByMonthKey[point.monthKey];

    const idx = indexByMonthKey[point.monthKey];
    const prevLabel = Number.isFinite(idx) && idx > 0 ? series[idx - 1].label : null;

    const totalNum = Number(point.total);
    const totalLabel = Number.isFinite(totalNum)
      ? formatMoney(totalNum, currency, language)
      : "—";

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
          maxWidth: 220,
        }}
      >
        <div style={{ fontWeight: 600 }}>{point.label}</div>

        <div style={{ marginTop: 2 }}>{totalLabel}</div>

        {delta != null && prevLabel && (
          <div style={{ opacity: 0.85, marginTop: 4 }}>
            vs {prevLabel}: {delta > 0 ? "+" : ""}
            {delta.toFixed(1)}%
          </div>
        )}

        {point.monthKey === inProgressMonthKey && (
          <div style={{ marginTop: 6, opacity: 0.7 }}>Mes en curso</div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Badge de moneda: hace explícito COP/EUR/USD, sin depender del eje */}
      <div className="mb-2 flex items-center justify-end">
        <span className="rounded-lg border border-white/15 bg-white/10 px-2 py-1 text-[11px] font-semibold text-white/80">
          Moneda: {currency?.toUpperCase?.() ?? "—"}
        </span>
      </div>

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

            {/* Eje Y compacto (K/M) para legibilidad */}
            <YAxis
              width={70}
              tick={{ fontSize: 12, fill: "rgba(255,255,255,0.75)" }}
              tickMargin={10}
              axisLine={{ stroke: "rgba(255,255,255,0.25)" }}
              tickLine={{ stroke: "rgba(255,255,255,0.25)" }}
              tickFormatter={(v) => formatCompactNumber(Number(v), language)}
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
    </div>
  );
}
