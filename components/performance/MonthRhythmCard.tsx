// src/components/performance/MonthRhythmCard.tsx
// -----------------------------------------------------------------------------
// Dinvox | Card: Ritmo del mes
//
// ✅ Respeta embedded (no crea tarjeta externa dentro del Accordion)
// ✅ Mantiene gráfico intacto
// ✅ Si NO hay referencia → muestra promedio diario
// -----------------------------------------------------------------------------

"use client";

import { useMemo } from "react";
import type { AnalysisPeriodValue } from "@/components/filters/PeriodFilter";
import {
  computeMonthPace,
  DEFAULT_MONTH_PACE_CONFIG,
} from "@/lib/analytics/pace";
import type { ExpenseForAnalytics } from "@/lib/analytics/tercios";
import MonthRhythmLineChart from "@/components/performance/MonthRhythmLineChart";
import { formatMoney as formatMoneyUI } from "@/lib/dinvox/expenses-utils";
import { useAppContext } from "@/lib/dinvox/app-context";
import {
  buildMonthPaceInsight,
  type MonthPaceInsight,
} from "@/lib/analytics/insights/monthPace";

// -----------------------
// Tipos
// -----------------------

type DailyTotal = {
  ymd: string;
  total: number;
  txCount: number;
};

type MonthRhythmCardProps = {
  period: Extract<AnalysisPeriodValue, "current_month" | "previous_month">;
  dailyTotals: DailyTotal[];
  selectedMonthKey: string;
  dayLimit: number;
  monthLabel: string;
  fallbackCurrency?: string;
  fallbackLanguage?: string;
  embedded?: boolean;
};

// -----------------------
// Helpers UI
// -----------------------

function formatPctSigned(pct: number): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function statusLabel(status: "contenido" | "normal" | "acelerado") {
  if (status === "contenido") return "Contenido";
  if (status === "acelerado") return "Acelerado";
  return "Normal";
}

function confidenceLabel(c: "sin_referencia" | "preliminar" | "solida") {
  if (c === "solida") return "Sólida";
  if (c === "preliminar") return "Preliminar";
  return "Sin referencia";
}

function deltaClass(deltaPct: number | null | undefined) {
  if (deltaPct == null) return "text-white";
  if (deltaPct > 0) return "text-rose-200";
  if (deltaPct < 0) return "text-emerald-200";
  return "text-white";
}

// -----------------------
// COMPONENTE
// -----------------------

export default function MonthRhythmCard({
  period,
  dailyTotals,
  selectedMonthKey,
  dayLimit,
  monthLabel,
  fallbackCurrency = "COP",
  fallbackLanguage = "es-CO",
  embedded = false,
}: MonthRhythmCardProps) {
  const { currency: ctxCurrency, language: ctxLanguage } = useAppContext();

  const analyticsInput: ExpenseForAnalytics[] = useMemo(() => {
    return (dailyTotals || [])
      .map((r) => ({
        date: r.ymd,
        amount: r.total,
      }))
      .filter((r) => !!r.date);
  }, [dailyTotals]);

  const pace = useMemo(() => {
    if (!selectedMonthKey || selectedMonthKey === "unknown") return null;

    const safeDayLimit =
      Number.isFinite(dayLimit) && dayLimit >= 1 ? dayLimit : 1;

    return computeMonthPace({
      expenses: analyticsInput,
      selectedMonthKey,
      dayLimit: safeDayLimit,
      config: DEFAULT_MONTH_PACE_CONFIG,
    });
  }, [analyticsInput, selectedMonthKey, dayLimit]);

  const insight = useMemo<MonthPaceInsight | null>(() => {
    return buildMonthPaceInsight({ pace, period, monthLabel });
  }, [pace, period, monthLabel]);

  const currency =
    ctxCurrency?.toUpperCase?.() ??
    fallbackCurrency?.toUpperCase?.() ??
    "COP";

  const language = ctxLanguage ?? fallbackLanguage ?? "es-CO";

  // 🔥 ESTE ES EL CAMBIO CLAVE
  return (
    <div
      className={
        embedded
          ? "w-full text-slate-100"
          : "w-full rounded-3xl border border-white/10 bg-gradient-to-br from-slate-700 via-slate-600 to-brand-500 shadow-xl text-slate-100 p-6"
      }
    >
      {!embedded && (
        <h3 className="text-2xl font-semibold mb-6">
          {period === "previous_month"
            ? "Ritmo del mes anterior"
            : "Ritmo del mes"}
        </h3>
      )}

      {!pace && (
        <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
          <p className="text-sm font-semibold">
            {insight?.headline}
          </p>
          {insight?.note && (
            <p className="text-xs mt-1 text-white/80">
              {insight.note}
            </p>
          )}
        </div>
      )}

      {pace && insight && (
        <div className="grid md:grid-cols-2 gap-6">

          {/* COLUMNA IZQUIERDA */}
          <div className="rounded-2xl border border-white/15 bg-white/10 p-5 space-y-4">

            <div className="flex justify-between text-xs text-white/70">
              <span>Mes</span>
              <span>{monthLabel}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">
                Confianza
              </span>

              <span className="text-lg font-bold tracking-wide">
                {confidenceLabel(pace.confidence)}
              </span>
            </div>

            {/* INSIGHT */}
            <div className="mt-3">
              <p className="text-sm font-semibold text-white">
                {insight.headline}
              </p>

              {/* Con referencia */}
              {insight.deltaPct != null && (
                <>
                  <div
                    className={`mt-3 text-3xl font-semibold ${deltaClass(
                      insight.deltaPct
                    )}`}
                  >
                    {formatPctSigned(insight.deltaPct)}
                  </div>

                  <div className="text-xs text-white/70 mt-1">
                    {insight.baselineMonthsUsedCount > 0
                      ? `vs promedio reciente (${insight.baselineMonthsUsedCount} mes${
                          insight.baselineMonthsUsedCount === 1 ? "" : "es"
                        })`
                      : "sin referencia"}
                  </div>
                </>
              )}

              {/* Sin referencia → promedio diario */}
              {insight.deltaPct == null &&
                pace.avgDailyActual != null && (
                  <div className="mt-4">
                    <div className="text-xs text-white/70">
                      Promedio diario (a la fecha)
                    </div>
                    <div className="text-lg font-semibold text-white mt-1">
                      {formatMoneyUI(
                        pace.avgDailyActual,
                        currency,
                        language
                      )}
                    </div>
                  </div>
                )}

              {insight.note && (
                <p className="mt-2 text-xs text-white/80">
                  {insight.note}
                </p>
              )}
            </div>

            {/* Estado técnico */}
            {pace.R != null && pace.status != null && (
              <div className="mt-4">
                <div className="text-2xl font-semibold text-white">
                  {statusLabel(pace.status)}
                </div>

                <div className="mt-3">
                  <div className="text-xs text-white/70">
                    Ritmo (R)
                  </div>
                  <div className="mt-1 text-lg font-semibold text-white">
                    {pace.R.toFixed(2)}x
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA (GRÁFICO) */}
          <div className="rounded-2xl border border-white/15 bg-white/10 p-5">
            <MonthRhythmLineChart
              data={pace.chart}
              currency={currency}
              language={language}
            />

            <div className="mt-3 text-xs text-white/70">
              Día analizado:{" "}
              <span className="font-semibold text-white">
                {pace.dayLimit}
              </span>
              {" • "}
              Acumulado:{" "}
              <span className="font-semibold text-white">
                {formatMoneyUI(
                  pace.actualToDay,
                  currency,
                  language
                )}
              </span>
              {pace.baselineToDay != null && (
                <>
                  {" • "}
                  Referencia:{" "}
                  <span className="font-semibold text-white">
                    {formatMoneyUI(
                      pace.baselineToDay,
                      currency,
                      language
                    )}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}