// src/components/performance/MonthThirdsCard.tsx
// ------------------------------------------------------------
// Dinvox | Card: Tercios del mes (Capa 1A)
//
// Objetivo:
// - Mostrar el desempeño del gasto del mes en 3 bloques (1–10 / 11–20 / 21–fin).
//
// Responsabilidades de esta card:
// - Descargar gastos reales del rango del mes (actual o anterior) desde `/api/expenses?from&to`.
// - Transformar los gastos al formato mínimo del módulo de analytics.
// - Calcular métricas por tercio con `computeMonthThirds()`.
// - Renderizar:
//    • Total del mes (y/o "a día de hoy" si es el mes actual)
//    • Estados de tercios (Pendiente / En curso / Cerrado)
//    • Cobertura (días con registros)
//    • Insight textual (headline + nota)
//    • Gráfico de barras por tercios
//
// 🆕 Optimización (API view):
// - Esta card NO necesita id ni note.
// - Ahora pide `view=analytics` para reducir payload.
// - Respuesta esperada (view=analytics):
//    [{ date, categoryId, amount, currency }, ...]
//
// Dónde se usa este patrón después:
// - MonthRhythmCard (ritmo): `view=analytics` (mes + 3 previos)
// - MonthlyEvolution (evolution): `view=analytics` (rangos largos)
//
// Moneda / idioma:
// - Fuente de verdad: AppContext (layout)
// - Props fallbackCurrency/fallbackLanguage quedan como respaldo por transición.
//
// Fetch:
// - Usa AbortController para evitar race conditions al cambiar periodo/montaje.
// ------------------------------------------------------------

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  computeMonthThirds,
  type ExpenseForAnalytics,
  type MonthThirdsMetrics,
} from "@/lib/analytics/tercios";
import {
  getMonthStartYYYYMMDD,
  getMonthEndYYYYMMDD,
  getTodayDay,
  getThirdStates,
  getThirdRangesLabelEs,
  getMonthLabelEs,
} from "@/lib/analytics/dates";
import MonthThirdsBarChart from "@/components/performance/MonthThirdsBarChart";
import type { AnalysisPeriodValue } from "@/components/filters/PeriodFilter";
import {
  buildMonthThirdsInsight,
  type MonthThirdsInsight,
} from "@/lib/analytics/insights/monthThirds";

// ✅ helper centralizado (respeta símbolo/decimales/locale)
import { formatMoney as formatMoneyUI } from "@/lib/dinvox/expenses-utils";

// ✅ contexto global (layout)
import { useAppContext } from "@/lib/dinvox/app-context";

type MonthThirdsCardProps = {
  period: Extract<AnalysisPeriodValue, "current_month" | "previous_month">;
  fallbackCurrency?: string; // ej "COP"
  fallbackLanguage?: string; // ej "es-CO"
  embedded?: boolean;
};

// ✅ Respuesta esperada con view=analytics
type ApiExpenseAnalytics = {
  date: string; // "YYYY-MM-DD"
  categoryId: string;
  amount: number;
  currency: string;
};

// Estado simple del tercio según el día del mes actual
type ThirdState = "no_iniciado" | "en_curso" | "cerrado";

// -----------------------
// Helpers (formatos UI)
// -----------------------
function thirdStateLabel(s: ThirdState) {
  if (s === "no_iniciado") return "Pendiente";
  if (s === "en_curso") return "En curso";
  return "Cerrado";
}

export default function MonthThirdsCard({
  period,
  fallbackCurrency = "COP",
  fallbackLanguage = "es-CO",
  embedded = false,
}: MonthThirdsCardProps) {
  // Contexto global (si no existe aún, fallbacks mantienen estabilidad)
  const app = useAppContext?.();
  const ctxCurrency = app?.currency;
  const ctxLanguage = app?.language;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Datos crudos desde API
  const [expenses, setExpenses] = useState<ApiExpenseAnalytics[]>([]);

  // Anchor del mes: día 1 evita bugs por 29/30/31
  const anchorDate = useMemo(() => {
    const d = new Date();
    return period === "previous_month"
      ? new Date(d.getFullYear(), d.getMonth() - 1, 1)
      : new Date(d.getFullYear(), d.getMonth(), 1);
  }, [period]);

  const from = useMemo(() => getMonthStartYYYYMMDD(anchorDate), [anchorDate]);
  const to = useMemo(() => getMonthEndYYYYMMDD(anchorDate), [anchorDate]);

  const monthLabel = useMemo(() => getMonthLabelEs(anchorDate), [anchorDate]);
  const thirdRanges = useMemo(
    () => getThirdRangesLabelEs(anchorDate, to),
    [anchorDate, to]
  );

  const isClosedMonth = period === "previous_month";

  // Estados de tercios:
  // - Mes anterior: todo cerrado
  // - Mes actual: según el día real de hoy
  const thirdStates = useMemo(() => {
    if (isClosedMonth) {
      return { t1: "cerrado", t2: "cerrado", t3: "cerrado" } as const;
    }
    const todayDay = getTodayDay(new Date());
    return getThirdStates(todayDay);
  }, [isClosedMonth]);

  // -----------------------
  // Fetch real a tu API (optimizado con view=analytics)
  // -----------------------
  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/expenses?from=${from}&to=${to}&view=analytics&transaction_type=expense`,
          {
            method: "GET",
            signal: controller.signal,
          }
        );

        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          const msg =
            payload?.error ??
            `Error al cargar gastos (${res.status} ${res.statusText}).`;
          throw new Error(msg);
        }

        const data = (await res.json()) as ApiExpenseAnalytics[];

        setExpenses(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (e?.name === "AbortError") return; // request cancelada (cambio de periodo / unmount)
        setError(e?.message ?? "Error desconocido al cargar gastos.");
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [from, to]);

  // -----------------------
  // Transformación a analytics
  // -----------------------
  const analyticsInput: ExpenseForAnalytics[] = useMemo(() => {
    return (expenses ?? []).map((e) => ({
      date: e.date,
      amount: e.amount,
    }));
  }, [expenses]);

  const metrics: MonthThirdsMetrics | null = useMemo(() => {
    return computeMonthThirds(analyticsInput);
  }, [analyticsInput]);

  const insight: MonthThirdsInsight | null = useMemo(() => {
    if (!metrics) return null;

    return buildMonthThirdsInsight({
      metrics,
      period,
      monthLabel,
    });
  }, [metrics, period, monthLabel]);

  // -----------------------
  // Moneda / idioma (source of truth)
  // -----------------------
  // currency: API(expenses[0]) -> AppContext -> fallback props -> default
  const currency = useMemo(() => {
    const apiCurrency = expenses?.[0]?.currency?.toUpperCase?.();
    return (
      apiCurrency ??
      (ctxCurrency?.toUpperCase?.() ??
        fallbackCurrency?.toUpperCase?.() ??
        "COP")
    );
  }, [expenses, ctxCurrency, fallbackCurrency]);

  // language: AppContext -> fallback props -> default
  const language = ctxLanguage ?? fallbackLanguage ?? "es-CO";

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
      {/* Header de la card (solo si NO está embebida dentro del Accordion) */}
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
        {loading && <p className="text-sm text-white/80">Cargando gastos…</p>}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200/40 bg-red-500/15 p-4">
            <p className="text-sm font-semibold text-red-100">Error</p>
            <p className="text-sm text-red-100/90 mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && !metrics && (
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
            <p className="text-sm font-semibold text-white">
              Aún no hay datos suficientes
            </p>
            <p className="text-sm text-white/80 mt-1">
              No se encontraron gastos en el rango {from} a {to}.
            </p>
          </div>
        )}

        {!loading && !error && metrics && (
          <div
            className={
              embedded
                ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                : "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
            }
          >
            {/* Columna izquierda: texto útil */}
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

            {/* Columna derecha: gráfico */}
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