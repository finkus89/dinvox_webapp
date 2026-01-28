// src/components/performance/MonthRhythmCard.tsx
// -----------------------------------------------------------------------------
// Capa 1B (v1): Card de "Ritmo del mes"
// - Lee gastos REALES en un rango amplio desde /api/expenses?from&to
// - Calcula ritmo del mes usando computeMonthPace() (analytics/pace.ts)
// - Muestra:
//   - Estado (Contenido / Normal / Acelerado) cuando hay baseline
//   - Confianza (Sólida / Preliminar / Sin referencia)
//   - R (x) y delta %
//   - Fallback cuando NO hay baseline: promedio diario hasta hoy
//
// IMPORTANTE:
// - No hace comparaciones en backend: todo es UI + analytics.
// - No modifica nada de Tercios.
// - Para baseline necesita data de (mes seleccionado + 3 meses previos).
//
// Este componente se usará en:
// - src/app/performance/page.tsx dentro de la sección "rhythm"
//
// Próximo paso (separado):
// - Agregar gráfico de líneas actual vs baseline (MonthRhythmLineChart)
// -----------------------------------------------------------------------------

"use client";

import { useEffect, useMemo, useState } from "react";
import type { AnalysisPeriodValue } from "@/components/filters/PeriodFilter";
import { computeMonthPace, DEFAULT_MONTH_PACE_CONFIG } from "@/lib/analytics/pace";
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

// -----------------------
// Tipos (alineado con /api/expenses)
// -----------------------

type MonthRhythmCardProps = {
  period: Extract<AnalysisPeriodValue, "current_month" | "previous_month">;
  fallbackCurrency?: string; // ej "COP"
  embedded?: boolean;
};

type ApiExpense = {
  id: string;
  date: string; // "YYYY-MM-DD"
  categoryId: string;
  amount: number;
  currency: string;
  note: string;
};

// -----------------------
// Helpers UI (misma idea que en Tercios)
// -----------------------

function formatMoney(amount: number, currency: string) {
  const rounded = Math.round(amount);
  const withSep = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${currency} ${withSep}`;
}

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
  embedded = false,
}: MonthRhythmCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Datos crudos desde API
  const [expenses, setExpenses] = useState<ApiExpense[]>([]);

  // Anchor date (igual patrón que en Tercios)
  // - previous_month: mes anterior (día 1)
  // - current_month: mes actual (día 1)
  const anchorDate = useMemo(() => {
    const d = new Date();
    return period === "previous_month"
      ? new Date(d.getFullYear(), d.getMonth() - 1, 1)
      : new Date(d.getFullYear(), d.getMonth(), 1);
  }, [period]);

  // month label visible en UI (ej: "Ene 2026")
  const monthLabel = useMemo(() => getMonthLabelEs(anchorDate), [anchorDate]);

  // Rango del mes seleccionado (para to / cálculo dayLimit)
  const selectedFrom = useMemo(() => getMonthStartYYYYMMDD(anchorDate), [anchorDate]);
  const selectedTo = useMemo(() => getMonthEndYYYYMMDD(anchorDate), [anchorDate]);

  // monthKey del mes seleccionado (YYYY-MM), inferido desde selectedFrom ("YYYY-MM-01")
  const selectedMonthKey = useMemo(() => {
    return getMonthKeyFromYYYYMMDD(selectedFrom) ?? "unknown";
  }, [selectedFrom]);

  // -----------------------
  // Rango amplio para traer data (mes seleccionado + 3 previos)
  // -----------------------
  // from = inicio del mes (M-3)
  // to   = fin del mes seleccionado (para previous_month) o fin del mes actual (para current_month)
  const wideFrom = useMemo(() => {
    if (selectedMonthKey === "unknown") return selectedFrom;
    const mk = shiftMonthKey(selectedMonthKey, -3);
    // Si por alguna razón falla, caemos al mes seleccionado
    return mk ? `${mk}-01` : selectedFrom;
  }, [selectedMonthKey, selectedFrom]);

  const wideTo = useMemo(() => selectedTo, [selectedTo]);

  // -----------------------
  // dayLimit (A): a ese día exacto
  // - Mes actual: hoy (día del mes)
  // - Mes anterior: fin de mes (porque ya cerró)
  // -----------------------
  const dayLimit = useMemo(() => {
    if (period === "previous_month") {
      // aquí el cálculo clamp se hace en pace.ts, pero igual intentamos ser coherentes
      // usando el último día del mes seleccionado (extraído de selectedTo).
      const endDay = Number(selectedTo.slice(8, 10));
      return Number.isFinite(endDay) && endDay > 0 ? endDay : 1;
    }

    // mes actual: hoy
    const today = getTodayDay(new Date());
    return today >= 1 ? today : 1;
  }, [period, selectedTo]);

  // -----------------------
  // Fetch: 1 sola llamada a /api/expenses con rango amplio
  // -----------------------
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/expenses?from=${wideFrom}&to=${wideTo}`, {
          method: "GET",
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          const msg =
            payload?.error ??
            `Error al cargar gastos (${res.status} ${res.statusText}).`;
          throw new Error(msg);
        }

        const data = (await res.json()) as ApiExpense[];

        if (!cancelled) {
          setExpenses(Array.isArray(data) ? data : []);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Error desconocido al cargar gastos.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
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
      // puedes ajustar thresholds aquí si un día quieres
      config: DEFAULT_MONTH_PACE_CONFIG,
    });
  }, [analyticsInput, selectedMonthKey, dayLimit]);

  // Moneda: 1) API (primer gasto), 2) fallback, 3) "COP"
  const currency = useMemo(() => {
    const apiCurrency = expenses?.[0]?.currency?.toUpperCase?.();
    return apiCurrency ?? (fallbackCurrency?.toUpperCase?.() ?? "COP");
  }, [expenses, fallbackCurrency]);

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
      {/* Header (si no está embebida) */}
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
          <div className={embedded ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"}>
            {/* =========================
                Columna izquierda: números + estado
                ========================= */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 space-y-2">
              {/* Mes */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/70">Mes</div>
                <div className="text-xs text-white/70">{monthLabel}</div>
              </div>

              {/* Confianza */}
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="text-xs text-white/70">Confianza</div>
                <div className="text-xs font-semibold text-white">
                  {confidenceLabel(pace.confidence)}
                </div>
              </div>

              {/* Resultado principal */}
              {pace.R != null && pace.deltaPct != null && pace.status != null ? (
                <div className="mt-4">
                  <div className="text-xs text-white/70">Estado</div>
                  <div className="mt-1 flex items-end justify-between gap-3">
                    <div className="text-2xl font-semibold text-white">
                      {statusLabel(pace.status)}
                    </div>
                    <div className="text-xs text-white/70">
                      {pace.baselineMonthsUsed.length > 0
                        ? `vs promedio reciente (${pace.baselineMonthsUsed.length} mes${pace.baselineMonthsUsed.length === 1 ? "" : "es"})`
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

                  {/* Tooltip / tabla de umbrales (simple, sin UI compleja aún) */}
                    <div className="mt-4 pt-4 border-t border-white/15">
                        <div className="text-xs text-white/70">Cómo va tu gasto</div>
                        <div className="mt-2 text-xs text-white/80 space-y-1">
                        <div>
                            <span className="font-semibold text-white">Gasto contenido:</span>{" "}
                            R &lt; {DEFAULT_MONTH_PACE_CONFIG.thresholdContenido}
                        </div>
                        <div>
                            <span className="font-semibold text-white">Gasto normal:</span>{" "}
                            {DEFAULT_MONTH_PACE_CONFIG.thresholdContenido} – {DEFAULT_MONTH_PACE_CONFIG.thresholdAcelerado}
                        </div>
                        <div>
                            <span className="font-semibold text-white">Gasto acelerado:</span>{" "}
                            R &gt; {DEFAULT_MONTH_PACE_CONFIG.thresholdAcelerado}
                        </div>
                        </div>
                    </div>
                </div>
              ) : (
                // Fallback: sin baseline (o baseline inválido)
                    <div className="mt-4 rounded-2xl border border-white/15 bg-white/10 p-4">
                        <p className="text-sm font-semibold text-white">
                            Aún no hay referencia suficiente
                        </p>
                        <p className="mt-1 text-xs text-white/80">
                            Este mes será tu referencia inicial. Por ahora te mostramos tu promedio diario.
                        </p>

                        <div className="mt-4 flex items-center justify-between gap-3">
                            <div className="text-xs text-white/70">Promedio diario (a la fecha)</div>
                            <div className="text-lg font-semibold text-white">
                            {formatMoney(pace.avgDailyActual, currency)}
                            </div>
                        </div>
                    </div>
              )}

              
            </div>

            {/* =========================
                Columna derecha: gráfico (placeholder por ahora)
                ========================= */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 sm:p-5">
                <div className="text-sm font-semibold text-white">Ritmo (acumulado)</div>
                <p className="mt-1 text-xs text-white/80">
                    Comparación del acumulado diario vs referencia (si existe).
                </p>

                <div className="mt-4">
                    <MonthRhythmLineChart data={pace.chart} currency={currency} />
                </div>

                <div className="mt-3 text-xs text-white/70">
                    Día analizado:{" "}
                    <span className="text-white/90 font-semibold">{pace.dayLimit}</span>
                    {" • "}
                    Acumulado:{" "}
                    <span className="text-white/90 font-semibold">
                    {formatMoney(pace.actualToDay, currency)}
                    </span>
                    {pace.baselineToDay != null ? (
                    <>
                        {" • "}
                        Referencia:{" "}
                        <span className="text-white/90 font-semibold">
                        {formatMoney(pace.baselineToDay, currency)}
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
