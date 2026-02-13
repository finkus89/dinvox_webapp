// src/components/performance/MonthRhythmLineChart.tsx
// -----------------------------------------------------------------------------
// Dinvox | Chart: Ritmo del mes (líneas acumuladas)
//
// Objetivo:
// - Visualizar el acumulado diario del gasto del mes (línea "Actual").
// - Si existe baseline, mostrar línea "Referencia" para comparar.
//
// Decisiones de UX:
// - Eje Y usa números compactos (K/M) para legibilidad.
// - La moneda NO se repite en cada tick (evita ruido visual).
// - Se muestra una etiqueta única "Valores en {currency}" arriba del gráfico.
//
// Moneda / idioma:
// - `currency` se recibe como código (COP/EUR/USD...)
// - `language` controla separadores y formato (fallback: es-CO).
// - Tooltips sí muestran formato completo con símbolo usando `formatMoney()`.
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
  Legend,
} from "recharts";

import type { MonthPaceChartPoint } from "@/lib/analytics/pace";
import { formatMoney } from "@/lib/dinvox/expenses-utils";

type Props = {
  data: MonthPaceChartPoint[];
  currency: string;      // ej: "COP" | "EUR" | "USD"
  language?: string;     // ej: "es-CO" | "es-ES" | "en-US"
};

// Formato compacto para eje Y (sin símbolo) para evitar ruido visual.
// El símbolo/moneda se indica una sola vez en la etiqueta superior.
function formatCompactNumber(value: number, language: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";

  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`;

  return new Intl.NumberFormat(language, { maximumFractionDigits: 0 }).format(n);
}

export default function MonthRhythmLineChart({ data, currency, language }: Props) {
  const lang = useMemo(() => language ?? "es-CO", [language]);

  const hasBaseline = useMemo(
    () => (data ?? []).some((d) => typeof d.baseline === "number"),
    [data]
  );

  return (
    <div className="w-full">
      {/* Etiqueta única de moneda (evita confusión sin ensuciar el eje Y) */}
      <div className="mb-2 flex items-center justify-end">
        <span className="text-[11px] text-white/60">
          Valores en{" "}
          <span className="font-semibold text-white/75">
            {String(currency ?? "").toUpperCase()}
          </span>
        </span>
      </div>

      <div className="h-56 sm:h-64">
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
              width={70}
              tick={{ fontSize: 12, fill: "rgba(255,255,255,0.75)" }}
              tickMargin={10}
              axisLine={{ stroke: "rgba(255,255,255,0.25)" }}
              tickLine={{ stroke: "rgba(255,255,255,0.25)" }}
              tickFormatter={(v) => formatCompactNumber(Number(v), lang)}
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
                const safe = Number.isFinite(n) ? formatMoney(n, currency, lang) : "—";
                return [safe, label];
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
    </div>
  );
}
