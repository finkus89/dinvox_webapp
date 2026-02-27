// src/components/performance/MonthThirdsCard.tsx
// ------------------------------------------------------------
// Dinvox | Card: Tercios del mes (Capa 1A)
//
// ✅ TZ-consistente (sin new Date() para estados/labels críticos)
//
// Esta card:
// - NO hace fetch.
// - Recibe expenses ya filtrados al mes desde PerformancePage.
// - Recibe monthLabel + todayDay (resueltos en TZ usuario) desde PerformancePage.
// - Solo calcula métricas e insight + render.
//
// Nota:
// - Para "previous_month", el padre igual pasa monthLabel correcto;
//   y aquí forzamos estados a "cerrado".
// ------------------------------------------------------------

"use client";

import { useMemo } from "react";
import {
  computeMonthThirds,
  type ExpenseForAnalytics,
  type MonthThirdsMetrics,
} from "@/lib/analytics/tercios";
import {
  getThirdStates,
  getThirdRangesLabelEs,
} from "@/lib/analytics/dates";
import MonthThirdsBarChart from "@/components/performance/MonthThirdsBarChart";
import type { AnalysisPeriodValue } from "@/components/filters/PeriodFilter";
import {
  buildMonthThirdsInsight,
  type MonthThirdsInsight,
} from "@/lib/analytics/insights/monthThirds";

import { formatMoney as formatMoneyUI } from "@/lib/dinvox/expenses-utils";
import { useAppContext } from "@/lib/dinvox/app-context";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

type ThirdState = "no_iniciado" | "en_curso" | "cerrado";

type MonthThirdsCardProps = {
  period: Extract<AnalysisPeriodValue, "current_month" | "previous_month">;

  /**
   * Data obligatoria desde el padre (ya filtrada al mes).
   * Formato mínimo:
   *   { date: "YYYY-MM-DD", amount: number }
   */
  expenses: {
    date: string;
    amount: number;
    currency?: string;
  }[];

  /**
   * ✅ Temporal resuelto por el padre (TZ usuario)
   * - monthLabel: etiqueta del mes (ej "feb 2026")
   * - todayDay: día del mes (1..31) en TZ usuario (solo importa para current_month)
   */
  monthLabel: string;
  todayDay: number;

  fallbackCurrency?: string;
  fallbackLanguage?: string;
  embedded?: boolean;
};

// ------------------------------------------------------------
// Helpers UI
// ------------------------------------------------------------

function thirdStateLabel(s: ThirdState) {
  if (s === "no_iniciado") return "Pendiente";
  if (s === "en_curso") return "En curso";
  return "Cerrado";
}

export default function MonthThirdsCard({
  period,
  expenses,
  monthLabel,
  todayDay,
  fallbackCurrency = "COP",
  fallbackLanguage = "es-CO",
  embedded = false,
}: MonthThirdsCardProps) {
  const app = useAppContext?.();
  const ctxCurrency = app?.currency;
  const ctxLanguage = app?.language;

  const isClosedMonth = period === "previous_month";

  // ------------------------------------------------------------
  // Estados de tercios (TZ-consistente)
  // ------------------------------------------------------------
  const thirdStates = useMemo(() => {
    if (isClosedMonth) {
      return { t1: "cerrado", t2: "cerrado", t3: "cerrado" } as const;
    }
    const safeToday = Number.isFinite(todayDay) && todayDay >= 1 ? todayDay : 1;
    return getThirdStates(safeToday);
  }, [isClosedMonth, todayDay]);

  // ------------------------------------------------------------
  // Ranges label (solo UI)
  // ------------------------------------------------------------
  // Aquí usamos un truco simple: derivamos "toYYYYMMDD" desde el último día visto en expenses
  // si existe, o caemos a "YYYY-MM-31". Esto SOLO afecta etiqueta del rango, no métricas.
  const thirdRanges = useMemo(() => {
    const toGuess =
      expenses?.length
        ? (expenses[expenses.length - 1]?.date ?? "")
        : "";

    // Para el label solo necesitamos el mes abreviado + fin real,
    // pero getThirdRangesLabelEs requiere (now: Date, toYYYYMMDD: string).
    // Para no usar Date local, dejamos "now" como new Date(0) (solo se usa para monthShortEs),
    // PERO eso sería incorrecto.
    //
    // ✅ Mejor: no usar getThirdRangesLabelEs aquí.
    // Como ya recibes monthLabel (ej "feb 2026"), el rango es cosmético.
    // Dejamos labels simples sin depender de Date:
    const endDay = toGuess?.slice(8, 10) || "31";
    const m = monthLabel.split(" ")[0] ?? ""; // "feb"
    return {
      t1: `01–10 ${m}`,
      t2: `11–20 ${m}`,
      t3: `21–${endDay} ${m}`,
    };
  }, [expenses, monthLabel]);

  // ------------------------------------------------------------
  // Adaptación a analytics
  // ------------------------------------------------------------
  const analyticsInput: ExpenseForAnalytics[] = useMemo(() => {
    return (expenses ?? []).map((e) => ({
      date: e.date,
      amount: e.amount,
    }));
  }, [expenses]);

  // ------------------------------------------------------------
  // Métricas
  // ------------------------------------------------------------
  const metrics: MonthThirdsMetrics | null = useMemo(() => {
    return computeMonthThirds(analyticsInput);
  }, [analyticsInput]);

  // ------------------------------------------------------------
  // Insight textual
  // ------------------------------------------------------------
  const insight: MonthThirdsInsight | null = useMemo(() => {
    if (!metrics) return null;

    return buildMonthThirdsInsight({
      metrics,
      period,
      monthLabel,
    });
  }, [metrics, period, monthLabel]);

  // ------------------------------------------------------------
  // Moneda / idioma
  // ------------------------------------------------------------
  const currency = useMemo(() => {
    const apiCurrency = expenses?.[0]?.currency?.toUpperCase?.();
    return (
      apiCurrency ??
      (ctxCurrency?.toUpperCase?.() ??
        fallbackCurrency?.toUpperCase?.() ??
        "COP")
    );
  }, [expenses, ctxCurrency, fallbackCurrency]);

  const language = ctxLanguage ?? fallbackLanguage ?? "es-CO";

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <div
      className={
        embedded
          ? "w-full text-slate-100"
          : `
            w-full
            rounded-3xl border border-white/10
            bg-gradient-to-br from-slate-700 via-slate-600 to-brand-500 backdrop-blur-xl shadow-xl
            text-slate-100
            p-4 sm:p-6 md:p-8 lg:p-8 xl:p-8
          `
      }
    >
      {!embedded && (
        <div className="flex flex-col gap-1">
          <h3 className="text-xl sm:text-2xl font-semibold tracking-tight">
            {isClosedMonth
              ? "Desempeño del gasto del mes anterior"
              : "Desempeño del gasto este mes"}
          </h3>
          <p className="text-sm text-white/80">
            {isClosedMonth
              ? "Cómo se distribuyó tu gasto a lo largo del mes."
              : "Cómo se ha distribuido tu gasto a lo largo del mes."}
          </p>
        </div>
      )}

      <div className={embedded ? "" : "mt-5 border-t border-white/15 pt-5"}>
        {!metrics && (
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
            <p className="text-sm font-semibold text-white">
              Aún no hay datos suficientes
            </p>
          </div>
        )}

        {metrics && (
          <div className={embedded ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"}>
            {/* Columna izquierda */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 space-y-2">
              <div className="mt-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-xs text-white/70">
                      {isClosedMonth
                        ? "Gasto total del mes"
                        : "Gasto total del mes a día de hoy"}
                    </div>
                    <div className="mt-1 text-2xl font-semibold text-white">
                      {formatMoneyUI(metrics.totalMonth, currency, language)}
                    </div>
                  </div>

                  <div className="text-xs text-white/70">{monthLabel}</div>
                </div>
              </div>

              {/* Estados compactos */}
              <div className="text-xs text-white/85 space-y-1">
                <div>
                  <span className="font-semibold text-white">
                    T1 ({thirdRanges.t1}):
                  </span>{" "}
                  {thirdStateLabel(thirdStates.t1)}
                </div>

                <div>
                  <span className="font-semibold text-white">
                    T2 ({thirdRanges.t2}):
                  </span>{" "}
                  {thirdStateLabel(thirdStates.t2)}
                </div>

                <div>
                  <span className="font-semibold text-white">
                    T3 ({thirdRanges.t3}):
                  </span>{" "}
                  {thirdStateLabel(thirdStates.t3)}
                </div>
              </div>

              {/* Cobertura */}
              <div className="mt-4 pt-4 border-t border-white/15">
                <div className="text-xs text-white/70">Cobertura</div>
                <p className="mt-1 text-sm text-white/85">
                  {isClosedMonth ? "Registraste" : "Has registrado"} gastos en{" "}
                  <span className="font-semibold text-white">
                    {metrics.activeDays} días
                  </span>{" "}
                  del mes
                  {metrics.firstDayWithExpense
                    ? ` (desde el día ${metrics.firstDayWithExpense}).`
                    : "."}
                </p>
              </div>

              {insight && (
                <div className="mt-4 rounded-2xl border border-white/15 bg-white/10 p-4">
                  <p className="text-sm font-semibold text-white">
                    {insight.headline}
                  </p>

                  {insight.note && (
                    <p className="mt-1 text-xs text-white/80">{insight.note}</p>
                  )}
                </div>
              )}
            </div>

            {/* Columna derecha */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 sm:p-5">
              <MonthThirdsBarChart
                t1={metrics.totalT1}
                t2={metrics.totalT2}
                t3={metrics.totalT3}
                pctT1={metrics.pctT1}
                pctT2={metrics.pctT2}
                pctT3={metrics.pctT3}
                currency={currency}
                language={language}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}