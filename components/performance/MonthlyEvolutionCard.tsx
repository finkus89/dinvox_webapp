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
// Notas clave:
// - monthlyCategoryTotals viene agregado por (monthKey, categoryId).
// - computeMonthlyEvolution espera date "YYYY-MM-DD" -> usamos `${monthKey}-01`.
// - Validamos monthKey y categoryId para evitar basura que rompa charts.
//
// Moneda/idioma:
// - Fuente de verdad: AppContext (layout).
// - Respaldo: fallbacks.
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

// ✅ helper central (moneda + decimales + locale)
import { formatMoney as formatMoneyUI } from "@/lib/dinvox/expenses-utils";

// ✅ contexto global (layout)
import { useAppContext } from "@/lib/dinvox/app-context";

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

  /**
   * 🆕 Data obligatoria desde el padre (bundle)
   * Rango recomendado: últimos 12 meses (incluye mes en curso).
   */
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
  return `${sign}${pct.toFixed(0)}%`;
}

function isCategoryId(x: string): x is CategoryId {
  return x in CATEGORIES;
}

function isMonthKey(x: string): boolean {
  return /^\d{4}-\d{2}$/.test(x);
}

export default function MonthlyEvolutionCard({
  period,
  monthlyCategoryTotals,
  fallbackCurrency = "COP",
  fallbackLanguage = "es-CO",
  embedded = false,
}: MonthlyEvolutionCardProps) {
  // ✅ Fuente de verdad para moneda/idioma
  const { currency: ctxCurrency, language: ctxLanguage } = useAppContext();

  // ⚠️ CategoryFilter trabaja con string -> mantenemos state como string|"all"
  const [category, setCategory] = useState<string | "all">("all");

  // -----------------------
  // Moneda + language (source of truth)
  // -----------------------
  const currency =
    ctxCurrency?.toUpperCase?.() ??
    fallbackCurrency?.toUpperCase?.() ??
    "COP";

  const language = ctxLanguage ?? fallbackLanguage ?? "es-CO";

  // -----------------------
  // categoryId seguro para analytics
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
    return CATEGORIES[categoryIdForAnalytics]?.color ?? "rgba(255,255,255,0.90)";
  }, [categoryIdForAnalytics]);

  // -----------------------
  // Adaptación: agregados por mes -> input de analytics
  // - Validamos monthKey y categoryId.
  // - Fabricamos date `${monthKey}-01`.
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
          categoryId: rawCategory, // ✅ aquí ya es CategoryId por el guard
        };
      })
      .filter((e): e is ExpenseForEvolution => e !== null);
  }, [monthlyCategoryTotals]);

  // -----------------------
  // Analytics
  // -----------------------
  const evolution = useMemo(() => {
    return computeMonthlyEvolution({
      expenses,
      period,
      categoryId: categoryIdForAnalytics,
    });
  }, [expenses, period, categoryIdForAnalytics]);

  // -----------------------
  // Headline (comparación último mes cerrado vs anterior)
  // -----------------------
  const headline = useMemo(() => {
    const hc = evolution.headlineComparison;
    if (!hc) return null;

    return {
      currentLabel: hc.currentLabel ?? "Último mes cerrado",
      prevLabel: hc.prevLabel ?? "mes anterior",
      currentTotal: hc.currentTotal,
      deltaPct: hc.deltaPct ?? null,
    };
  }, [evolution.headlineComparison]);

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

        {headline && (
          <div className="rounded-xl border border-white/15 bg-white/10 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-white">
                {headline.currentLabel} (último mes cerrado):
              </span>

              <span className="text-white/90">
                {formatMoneyUI(headline.currentTotal, currency, language)}
              </span>

              <span className="text-white/60">vs {headline.prevLabel}</span>

              {headline.deltaPct != null && (
                <span
                  className={`font-semibold ${
                    headline.deltaPct > 0
                      ? "text-red-400"
                      : headline.deltaPct < 0
                      ? "text-emerald-400"
                      : "text-white/70"
                  }`}
                >
                  {formatPct(headline.deltaPct)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <MonthlyEvolutionLineChart
        series={evolution.series}
        monthDeltaPctByMonthKey={evolution.monthDeltaPctByMonthKey}
        inProgressMonthKey={evolution.inProgressMonthKey}
        currency={currency}
        language={language}
        lineColor={lineColor}
      />
    </div>
  );
}