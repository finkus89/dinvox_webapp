// src/components/performance/MonthRhythmCard.tsx
// -----------------------------------------------------------------------------
// Dinvox | Card: Ritmo del mes (Capa 1B)
//
// Objetivo:
// - Medir el "ritmo" del gasto del mes comparándolo contra una referencia reciente
//   (baseline: meses previos) para detectar si el usuario va:
//     • Contenido • Normal • Acelerado
//
// Qué hace:
// - Descarga gastos reales de un rango amplio: (mes seleccionado + 3 meses previos)
//   usando `/api/expenses?from&to`.
// - Calcula métricas con `computeMonthPace()` (analytics/pace.ts).
// - Renderiza:
//    • Estado (Contenido/Normal/Acelerado) si hay baseline
//    • Confianza (Sólida/Preliminar/Sin referencia)
//    • Ritmo R (x) y delta % vs baseline
//    • Fallback sin baseline: promedio diario actual
//    • Gráfico acumulado actual vs baseline (si existe)
//
// 🆕 Optimización (API view):
// - Esta card NO necesita id ni note.
// - Ahora pide `view=analytics` para reducir payload.
// - Además envía `transaction_type=expense` explícito para evitar drift cuando se
//   activen ingresos.
// - Respuesta esperada (view=analytics):
//    [{ date, categoryId, amount, currency }, ...]
//
// Moneda / idioma:
// - Fuente de verdad: AppContext (layout).
// - Respaldo: API (primer gasto) -> fallbacks -> default.
//
// Fetch:
// - Usa AbortController para evitar race conditions al cambiar periodo/montaje.
// - Usa helper central `fetchExpenses()` (refactor /api/expenses).
// -----------------------------------------------------------------------------

"use client";

import { useEffect, useMemo, useState } from "react";
import type { AnalysisPeriodValue } from "@/components/filters/PeriodFilter";
import {
  computeMonthPace,
  DEFAULT_MONTH_PACE_CONFIG,
} from "@/lib/analytics/pace";
import type { ExpenseForAnalytics } from "@/lib/analytics/tercios";
import MonthRhythmLineChart from "@/components/performance/MonthRhythmLineChart";
import {
  getMonthStartYYYYMMDD,
  getMonthEndYYYYMMDD,
  getTodayDay,
  getMonthLabelEs,
  getMonthKeyFromYYYYMMDD,
  shiftMonthKey,
} from "@/lib/analytics/dates";

// ✅ helper central (moneda + decimales + locale)
import { formatMoney as formatMoneyUI } from "@/lib/dinvox/expenses-utils";

// ✅ contexto global (layout)
import { useAppContext } from "@/lib/dinvox/app-context";

// ✅ Helpers centralizados para /api/expenses (refactor)
import { fetchExpenses } from "@/lib/dinvox/expenses-api";
import type { ApiExpenseAnalytics } from "@/lib/dinvox/expenses-api-types";

// -----------------------
// Tipos (alineado con /api/expenses)
// -----------------------

type MonthRhythmCardProps = {
  period: Extract<AnalysisPeriodValue, "current_month" | "previous_month">;
  fallbackCurrency?: string; // ej "COP"
  fallbackLanguage?: string; // ej "es-CO" | "es-ES" | "en-US" | "en-CA"
  embedded?: boolean;
};

// -----------------------
// Helpers UI
// -----------------------

function formatPctSigned(pct: number): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}%`;
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

export default function MonthRhythmCard({
  period,
  fallbackCurrency = "COP",
  fallbackLanguage = "es-CO",
  embedded = false,
}: MonthRhythmCardProps) {
  // ✅ Hook SIEMPRE se llama (regla de hooks)
  // Fuente de verdad para moneda/idioma.
  const { currency: ctxCurrency, language: ctxLanguage } = useAppContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Datos crudos desde API (view=analytics)
  const [expenses, setExpenses] = useState<ApiExpenseAnalytics[]>([]);

  // Anchor date:
  // - previous_month: mes anterior (día 1)
  // - current_month: mes actual (día 1)
  const anchorDate = useMemo(() => {
    const d = new Date();
    return period === "previous_month"
      ? new Date(d.getFullYear(), d.getMonth() - 1, 1)
      : new Date(d.getFullYear(), d.getMonth(), 1);
  }, [period]);

  const monthLabel = useMemo(() => getMonthLabelEs(anchorDate), [anchorDate]);

  // Rango del mes seleccionado (para dayLimit y to)
  const selectedFrom = useMemo(
    () => getMonthStartYYYYMMDD(anchorDate),
    [anchorDate]
  );
  const selectedTo = useMemo(
    () => getMonthEndYYYYMMDD(anchorDate),
    [anchorDate]
  );

  // monthKey del mes seleccionado (YYYY-MM)
  const selectedMonthKey = useMemo(() => {
    return getMonthKeyFromYYYYMMDD(selectedFrom) ?? "unknown";
  }, [selectedFrom]);

  // -----------------------
  // Rango amplio: mes seleccionado + 3 previos
  // -----------------------
  const wideFrom = useMemo(() => {
    if (selectedMonthKey === "unknown") return selectedFrom;
    const mk = shiftMonthKey(selectedMonthKey, -3);
    return mk ? `${mk}-01` : selectedFrom;
  }, [selectedMonthKey, selectedFrom]);

  const wideTo = useMemo(() => selectedTo, [selectedTo]);

  // -----------------------
  // dayLimit:
  // - Mes actual: hoy
  // - Mes anterior: fin de mes (porque ya cerró)
  // -----------------------
  const dayLimit = useMemo(() => {
    if (period === "previous_month") {
      const endDay = Number(selectedTo.slice(8, 10));
      return Number.isFinite(endDay) && endDay > 0 ? endDay : 1;
    }

    const today = getTodayDay(new Date());
    return today >= 1 ? today : 1;
  }, [period, selectedTo]);

  // -----------------------
  // Fetch (1 llamada) a /api/expenses con rango amplio
  // -----------------------
  // 🆕 Refactor /api/expenses:
  // - view=analytics (payload mínimo)
  // - transaction_type=expense explícito
  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchExpenses<ApiExpenseAnalytics>(
          {
            from: wideFrom,
            to: wideTo,
            view: "analytics",
            transaction_type: "expense",
          },
          { signal: controller.signal }
        );

        setExpenses(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message ?? "Error desconocido al cargar gastos.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [wideFrom, wideTo]);

  // -----------------------
  // Adaptación: API -> analytics input
  // -----------------------
  const analyticsInput: ExpenseForAnalytics[] = useMemo(() => {
    return (expenses ?? []).map((e) => ({
      date: e.date,
      amount: e.amount,
    }));
  }, [expenses]);

  // -----------------------
  // Cálculo del ritmo
  // -----------------------
  const pace = useMemo(() => {
    if (selectedMonthKey === "unknown") return null;

    return computeMonthPace({
      expenses: analyticsInput,
      selectedMonthKey,
      dayLimit,
      config: DEFAULT_MONTH_PACE_CONFIG,
    });
  }, [analyticsInput, selectedMonthKey, dayLimit]);

  // -----------------------
  // Moneda / idioma (source of truth: AppContext)
  // -----------------------
  const currency = useMemo(() => {
    const apiCurrency = expenses?.[0]?.currency?.toUpperCase?.();

    return (
      ctxCurrency?.toUpperCase?.() ??
      apiCurrency ??
      fallbackCurrency?.toUpperCase?.() ??
      "COP"
    );
  }, [ctxCurrency, expenses, fallbackCurrency]);

  // ✅ language: AppContext -> fallback -> default (no uppercase)
  const language = ctxLanguage ?? fallbackLanguage ?? "es-CO";

  // -----------------------
  // Render
  // -----------------------
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
            {period === "previous_month"
              ? "Ritmo del mes anterior"
              : "Ritmo del mes"}
          </h3>
          <p className="text-sm text-white/80">
            {period === "previous_month"
              ? "Cómo avanzó tu gasto durante el mes comparado con tu referencia reciente."
              : "Cómo va tu gasto este mes comparado con tu referencia reciente."}
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

        {!loading && !error && !pace && (
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
            <p className="text-sm font-semibold text-white">
              No se pudo calcular el ritmo
            </p>
            <p className="text-sm text-white/80 mt-1">
              Revisa que exista data para el mes {monthLabel}.
            </p>
          </div>
        )}

        {!loading && !error && pace && (
          <div
            className={
              embedded
                ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                : "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
            }
          >
            {/* Columna izquierda: números + estado */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/70">Mes</div>
                <div className="text-xs text-white/70">{monthLabel}</div>
              </div>

              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="text-xs text-white/70">Confianza</div>
                <div className="text-xs font-semibold text-white">
                  {confidenceLabel(pace.confidence)}
                </div>
              </div>

              {pace.R != null && pace.deltaPct != null && pace.status != null ? (
                <div className="mt-4">
                  <div className="text-xs text-white/70">Estado</div>
                  <div className="mt-1 flex items-end justify-between gap-3">
                    <div className="text-2xl font-semibold text-white">
                      {statusLabel(pace.status)}
                    </div>
                    <div className="text-xs text-white/70">
                      {pace.baselineMonthsUsed.length > 0
                        ? `vs promedio reciente (${pace.baselineMonthsUsed.length} mes${
                            pace.baselineMonthsUsed.length === 1 ? "" : "es"
                          })`
                        : "sin referencia"}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                      <div className="text-xs text-white/70">Ritmo (R)</div>
                      <div className="mt-1 text-lg font-semibold text-white">
                        {pace.R.toFixed(2)}x
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                      <div className="text-xs text-white/70">Diferencia</div>
                      <div className="mt-1 text-lg font-semibold text-white">
                        {formatPctSigned(pace.deltaPct)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/15">
                    <div className="text-xs text-white/70">Cómo va tu gasto</div>
                    <div className="mt-2 text-xs text-white/80 space-y-1">
                      <div>
                        <span className="font-semibold text-white">
                          Gasto contenido:
                        </span>{" "}
                        R &lt; {DEFAULT_MONTH_PACE_CONFIG.thresholdContenido}
                      </div>
                      <div>
                        <span className="font-semibold text-white">
                          Gasto normal:
                        </span>{" "}
                        {DEFAULT_MONTH_PACE_CONFIG.thresholdContenido} –{" "}
                        {DEFAULT_MONTH_PACE_CONFIG.thresholdAcelerado}
                      </div>
                      <div>
                        <span className="font-semibold text-white">
                          Gasto acelerado:
                        </span>{" "}
                        R &gt; {DEFAULT_MONTH_PACE_CONFIG.thresholdAcelerado}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-white/15 bg-white/10 p-4">
                  <p className="text-sm font-semibold text-white">
                    Aún no hay referencia suficiente
                  </p>
                  <p className="mt-1 text-xs text-white/80">
                    Este mes será tu referencia inicial. Por ahora te mostramos
                    tu promedio diario.
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-xs text-white/70">
                      Promedio diario (a la fecha)
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {formatMoneyUI(pace.avgDailyActual, currency, language)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Columna derecha: gráfico */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 sm:p-5">
              <div className="text-sm font-semibold text-white">
                Ritmo (acumulado)
              </div>
              <p className="mt-1 text-xs text-white/80">
                Comparación del acumulado diario vs referencia (si existe).
              </p>

              <div className="mt-4">
                <MonthRhythmLineChart
                  data={pace.chart}
                  currency={currency}
                  language={language}
                />
              </div>

              <div className="mt-3 text-xs text-white/70">
                Día analizado:{" "}
                <span className="text-white/90 font-semibold">
                  {pace.dayLimit}
                </span>
                {" • "}
                Acumulado:{" "}
                <span className="text-white/90 font-semibold">
                  {formatMoneyUI(pace.actualToDay, currency, language)}
                </span>
                {pace.baselineToDay != null ? (
                  <>
                    {" • "}
                    Referencia:{" "}
                    <span className="text-white/90 font-semibold">
                      {formatMoneyUI(pace.baselineToDay, currency, language)}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}