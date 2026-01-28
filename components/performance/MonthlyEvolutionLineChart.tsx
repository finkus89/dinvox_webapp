// src/components/performance/MonthlyEvolutionLineChart.tsx
// -----------------------------------------------------------------------------
// UI: Gráfico de evolución mensual (línea)
//
// Qué muestra:
// - Total de gastos por mes (según período seleccionado: 6M / 12M / año)
// - Serie continua, incluyendo meses en 0
// - Línea recta (no curva) para reflejar comportamiento real del gasto
//
// Interacciones:
// - Tooltip compacto y legible en móvil
//   · Línea 1: Mes (ej. "Dic 2025")
//   · Línea 2: Total del mes
//   · Línea 3: Comparación vs mes anterior (solo si aplica)
//   · Indicador "Mes en curso" cuando corresponde
//
// Qué NO hace este componente:
// - No calcula datos (eso vive en analytics/evolution.ts)
// - No decide períodos ni categorías
// - No formatea moneda avanzada (solo compacto)
//
// Entradas:
// - series: [{ monthKey, label, total }]
// - monthDeltaPctByMonthKey: { [monthKey]: % vs mes anterior | null }
// - inProgressMonthKey: mes actual del calendario (YYYY-MM)
// - currency: moneda del usuario (ej: "COP", "USD")
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Tipos
// -----------------------------------------------------------------------------

type Props = {
  series: {
    monthKey: string; // "YYYY-MM"
    label: string;    // ej "Dic 2025"
    total: number;
  }[];
  monthDeltaPctByMonthKey: Record<string, number | null>;
  inProgressMonthKey: string;
  currency: string;
  lineColor?: string;
};

// -----------------------------------------------------------------------------
// Helpers de formato
// -----------------------------------------------------------------------------

// Formato compacto sin símbolo de moneda (para ejes)
function formatMoneyCompact(amount: number): string {
  const rounded = Math.round(amount);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Formato con moneda (para tooltip)
function formatMoney(amount: number, currency: string) {
  return `${currency} ${formatMoneyCompact(amount)}`;
}

// -----------------------------------------------------------------------------
// Componente
// -----------------------------------------------------------------------------

export default function MonthlyEvolutionLineChart({
  series,
  monthDeltaPctByMonthKey,
  inProgressMonthKey,
  currency,
  lineColor,
}: Props) {

  // ---------------------------------------------------------------------------
  // Tooltip custom
  // ---------------------------------------------------------------------------
  // Regla:
  // - No más de 2–3 líneas visibles
  // - Siempre decir explícitamente "vs {mes anterior}"
  // - No mostrar % si no aplica
  // - Indicar "Mes en curso" cuando corresponde
  // ---------------------------------------------------------------------------

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload;

    // Delta porcentual vs mes anterior (ya calculado en analytics)
    const delta = monthDeltaPctByMonthKey[data.monthKey];

    // Buscar el mes anterior SOLO para mostrar el label
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
          maxWidth: 180,
        }}
      >
        {/* Línea 1: mes */}
        <div style={{ fontWeight: 600 }}>{data.label}</div>

        {/* Línea 2: total */}
        <div>{formatMoney(data.total, currency)}</div>

        {/* Línea 3: comparación vs mes anterior */}
        {delta != null && prevLabel && (
          <div style={{ opacity: 0.85 }}>
            vs {prevLabel}: {delta > 0 ? "+" : ""}
            {delta.toFixed(0)}%
          </div>
        )}

        {/* Indicador mes en curso */}
        {data.monthKey === inProgressMonthKey && (
          <div style={{ marginTop: 4, opacity: 0.7 }}>
            Mes en curso
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

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
            width={88}
            tick={{ fontSize: 12, fill: "rgba(255,255,255,0.75)" }}
            tickMargin={10}
            axisLine={{ stroke: "rgba(255,255,255,0.25)" }}
            tickLine={{ stroke: "rgba(255,255,255,0.25)" }}
            tickFormatter={(v) => formatMoneyCompact(Number(v))}
          />

          <Tooltip content={<CustomTooltip />} />

          <Line
            type="linear"              // Línea recta (comportamiento real)
            dataKey="total"
            name="total"
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
