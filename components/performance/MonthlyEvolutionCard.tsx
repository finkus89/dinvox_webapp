// src/components/performance/MonthlyEvolutionCard.tsx
// -----------------------------------------------------------------------------
// Dinvox | Card: Evolución mensual (Capa 1C)
//
// ✅ Data-Driven (Performance Bundle)
// - NO hace fetch.
// - NO maneja loading/error.
// - Recibe agregados mensuales desde PerformancePage (bundle).
// - Adapta shape -> computeMonthlyEvolution -> render.
//
// ✅ Cambio interno (sin tocar el gráfico):
// - Insight pasa a builder dedicado (como Ritmo).
// - Se agrega un bloque opcional de "drivers" por categoría:
//   • Solo cuando category === "all"
//   • Solo si existen categorías que cumplan el umbral (>= 8% del total del mes cerrado)
//   • Top 2 suben / top 2 bajan por deltaAmount (dinero)
// -----------------------------------------------------------------------------
//
// ✅ Cambio de presentación (coherencia con Ritmo/Tercios):
// - El gráfico ahora vive dentro de un panel (tarjeta interna), no suelto.
// - Los "drivers" (top suben/bajan) ya NO son tarjetas dentro de tarjeta:
//   quedan integrados en el mismo panel del insight.
// - Layout: 2 filas (insight arriba, gráfico abajo), no 2 columnas.
// -----------------------------------------------------------------------------

"use client";

import { useMemo, useState } from "react";
import type { AnalysisPeriodValue } from "@/components/filters/PeriodFilter";
import CategoryFilter from "@/components/filters/CategoryFilter";
import { CATEGORIES, type CategoryId } from "@/lib/dinvox/categories";
import {
  computeMonthlyEvolution,
  type ExpenseForEvolution,
} from "@/lib/analytics/evolution";
import MonthlyEvolutionLineChart from "@/components/performance/MonthlyEvolutionLineChart";

import { formatMoney as formatMoneyUI } from "@/lib/dinvox/expenses-utils";
import { useAppContext } from "@/lib/dinvox/app-context";

// ✅ nuevo: insight separado (headline + drivers)
import { buildMonthlyEvolutionInsight } from "@/lib/analytics/insights/monthlyEvolution";

// -----------------------
// Props
// -----------------------

type MonthlyCategoryTotalRow = {
  monthKey: string; // "YYYY-MM"
  categoryId: string;
  total: number;
  txCount: number;
};

type MonthlyEvolutionCardProps = {
  period: Extract<
    AnalysisPeriodValue,
    "last_6_months" | "last_12_months" | "year_to_date"
  >;

  monthlyCategoryTotals: MonthlyCategoryTotalRow[];

  fallbackCurrency?: string;
  fallbackLanguage?: string;
  embedded?: boolean;
};

// -----------------------
// Utils UI
// -----------------------

function formatPct(pct: number) {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function isCategoryId(x: string): x is CategoryId {
  return x in CATEGORIES;
}

function isMonthKey(x: string): boolean {
  return /^\d{4}-\d{2}$/.test(x);
}

function formatSignedMoney(
  value: number,
  currency: string,
  language: string
): string {
  if (value === 0) {
    return formatMoneyUI(0, currency, language);
  }

  const sign = value > 0 ? "+" : "-";

  return `${sign}${formatMoneyUI(Math.abs(value), currency, language)}`;
}

export default function MonthlyEvolutionCard({
  period,
  monthlyCategoryTotals,
  fallbackCurrency = "COP",
  fallbackLanguage = "es-CO",
  embedded = false,
}: MonthlyEvolutionCardProps) {
  const { currency: ctxCurrency, language: ctxLanguage } = useAppContext();

  const [category, setCategory] = useState<string | "all">("all");

  // -----------------------
  // Moneda + language
  // -----------------------
  const currency =
    ctxCurrency?.toUpperCase?.() ??
    fallbackCurrency?.toUpperCase?.() ??
    "COP";

  const language = ctxLanguage ?? fallbackLanguage ?? "es-CO";

  // -----------------------
  // categoryId seguro
  // -----------------------
  const categoryIdForAnalytics: CategoryId | "all" = useMemo(() => {
    if (category === "all") return "all";
    return isCategoryId(category) ? category : "all";
  }, [category]);

  // -----------------------
  // Copy dinámico
  // -----------------------
  const categoryLabel = useMemo(() => {
    if (categoryIdForAnalytics === "all") return null;
    return CATEGORIES[categoryIdForAnalytics]?.label ?? null;
  }, [categoryIdForAnalytics]);

  // -----------------------
  // Color de la línea (si filtras por categoría)
  // -----------------------
  const lineColor = useMemo(() => {
    if (categoryIdForAnalytics === "all") return "rgba(255,255,255,0.90)";
    return (
      CATEGORIES[categoryIdForAnalytics]?.color ?? "rgba(255,255,255,0.90)"
    );
  }, [categoryIdForAnalytics]);

  // -----------------------
  // Adaptación: agregados por mes -> input analytics
  // -----------------------
  const expenses: ExpenseForEvolution[] = useMemo(() => {
    const rows = Array.isArray(monthlyCategoryTotals)
      ? monthlyCategoryTotals
      : [];

    return rows
      .map((r) => {
        const monthKey = String(r.monthKey ?? "");
        const rawCategory = String(r.categoryId ?? "").toLowerCase();
        const amount = Number(r.total);

        if (!isMonthKey(monthKey)) return null;
        if (!isCategoryId(rawCategory)) return null;
        if (!Number.isFinite(amount)) return null;

        return {
          date: `${monthKey}-01`,
          amount,
          categoryId: rawCategory,
        };
      })
      .filter((e): e is ExpenseForEvolution => e !== null);
  }, [monthlyCategoryTotals]);

  // -----------------------
  // Analytics (cálculo)
  // -----------------------
  const evolution = useMemo(() => {
    return computeMonthlyEvolution({
      expenses,
      period,
      categoryId: categoryIdForAnalytics,
    });
  }, [expenses, period, categoryIdForAnalytics]);

  // -----------------------
  // Insight (headline + drivers)
  // - headline: igual que hoy
  // - drivers: solo aplica si category === "all" y hay categorías que pasen umbral
  // -----------------------
  const insight = useMemo(() => {
    return buildMonthlyEvolutionInsight(evolution, categoryIdForAnalytics);
  }, [evolution, categoryIdForAnalytics]);

  // -----------------------
  // Render helpers drivers
  // -----------------------
  const showDrivers =
    categoryIdForAnalytics === "all" &&
    ((insight.topUp?.length ?? 0) > 0 || (insight.topDown?.length ?? 0) > 0);

  // -----------------------
  // Render
  // -----------------------
  return (
    <div className={embedded ? "text-slate-100" : "text-slate-100 p-4"}>
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          {!embedded && (
            <div>
              <h3 className="text-lg font-semibold">Evolución mensual</h3>
              <p className="text-xs text-white/70">
                {categoryLabel
                  ? `Cómo han sido tus gastos de ${categoryLabel} mes a mes.`
                  : "Cómo han sido tus gastos totales mes a mes."}
              </p>
            </div>
          )}

          <div className="w-full sm:w-64">
            <CategoryFilter value={category} onChange={setCategory} />
          </div>
        </div>

        {embedded && (
          <p className="text-xs text-white/70">
            {categoryLabel
              ? `Cómo han sido tus gastos de ${categoryLabel} mes a mes.`
              : "Cómo han sido tus gastos totales mes a mes."}
          </p>
        )}
      </div>

      {/* ✅ Layout coherente con Ritmo/Tercios: 2 filas (insight arriba, chart abajo) */}
      <div className="flex flex-col gap-3">
        {/* -----------------------
            Fila 1: Insight + Drivers (mismo panel)
           ----------------------- */}
        <div className="rounded-xl border border-white/15 bg-white/10 p-3">
          {insight.headline ? (
            <>
              {/* --- Headline (igual que hoy) --- */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold text-white">
                  {insight.headline.currentLabel} (último mes cerrado):
                </span>

                <span className="text-white/90">
                  {formatMoneyUI(
                    insight.headline.currentTotal,
                    currency,
                    language
                  )}
                </span>

                <span className="text-white/60">
                  vs {insight.headline.prevLabel}
                </span>

                {insight.headline.deltaPct != null && (
                  <span
                    className={`font-semibold ${
                      insight.headline.deltaPct > 0
                        ? "text-red-400"
                        : insight.headline.deltaPct < 0
                        ? "text-emerald-400"
                        : "text-white/70"
                    }`}
                  >
                    {formatPct(insight.headline.deltaPct)}
                  </span>
                )}
              </div>

              {/* --- Drivers integrados (sin tarjetas internas) --- */}
              {showDrivers && (
                <div className="mt-3 border-t border-white/10 pt-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Subieron */}
                    {insight.topUp?.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-white/85">
                          Categorías que más subieron
                        </div>

                        <div className="mt-2 space-y-1.5">
                          {insight.topUp.map((d, idx) => (
                            <div
                              key={`${d.categoryId}-${idx}`}
                              className="flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-base">
                                  {d.emoji ?? "•"}
                                </span>
                                <span className="text-white/90">{d.label}</span>
                              </div>

                              <div className="text-sm font-semibold text-red-300">
                                {formatSignedMoney(
                                  d.deltaAmount,
                                  currency,
                                  language
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bajaron */}
                    {insight.topDown?.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-white/85">
                          Categorías que más bajaron
                        </div>

                        <div className="mt-2 space-y-1.5">
                          {insight.topDown.map((d, idx) => (
                            <div
                              key={`${d.categoryId}-${idx}`}
                              className="flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-base">
                                  {d.emoji ?? "•"}
                                </span>
                                <span className="text-white/90">{d.label}</span>
                              </div>

                              <div className="text-sm font-semibold text-emerald-300">
                                {formatSignedMoney(
                                  d.deltaAmount,
                                  currency,
                                  language
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-white/75">
              No hay datos suficientes para calcular la evolución en este período.
            </div>
          )}
        </div>

        {/* -----------------------
            Fila 2: Gráfico (encapsulado como los otros)
           ----------------------- */}
        <div className="rounded-xl border border-white/15 bg-white/10 p-3">
          <MonthlyEvolutionLineChart
            series={evolution.series}
            monthDeltaPctByMonthKey={evolution.monthDeltaPctByMonthKey}
            inProgressMonthKey={evolution.inProgressMonthKey}
            currency={currency}
            language={language}
            lineColor={lineColor}
          />
        </div>
      </div>
    </div>
  );
}