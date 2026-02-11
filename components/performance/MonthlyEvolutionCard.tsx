"use client";

import { useEffect, useMemo, useState } from "react";
import type { AnalysisPeriodValue } from "@/components/filters/PeriodFilter";
import CategoryFilter from "@/components/filters/CategoryFilter";
import { CATEGORIES, type CategoryId } from "@/lib/dinvox/categories";
import {
  getMonthStartFromMonthKey,
  getMonthEndFromMonthKey,
  shiftMonthKey,
  getMonthKeyFromDate,
} from "@/lib/analytics/dates";
import {
  computeMonthlyEvolution,
  type ExpenseForEvolution,
} from "@/lib/analytics/evolution";
import MonthlyEvolutionLineChart from "@/components/performance/MonthlyEvolutionLineChart";

// ✅ helper central
import { formatMoney as formatMoneyUI } from "@/lib/dinvox/expenses-utils";

// -----------------------
// Props
// -----------------------
type MonthlyEvolutionCardProps = {
  period: Extract<
    AnalysisPeriodValue,
    "last_6_months" | "last_12_months" | "year_to_date"
  >;
  fallbackCurrency?: string;
  fallbackLanguage?: string; // ✅
  embedded?: boolean;
};

// -----------------------
// Tipos: respuesta real de /api/expenses
// -----------------------
type ApiExpense = {
  id: string;
  date: string; // "YYYY-MM-DD"
  categoryId: string;
  amount: number;
  currency: string;
  note: string;
};

// -----------------------
// Utils
// -----------------------
function formatPct(pct: number) {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}%`;
}

function isCategoryId(x: string): x is CategoryId {
  return x in CATEGORIES;
}

// -----------------------
// Component
// -----------------------
export default function MonthlyEvolutionCard({
  period,
  fallbackCurrency = "COP",
  fallbackLanguage = "es-CO",
  embedded = false,
}: MonthlyEvolutionCardProps) {
  const [apiExpenses, setApiExpenses] = useState<ApiExpense[]>([]);
  const [expenses, setExpenses] = useState<ExpenseForEvolution[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string | "all">("all");

  // -----------------------
  // Rango from / to
  // -----------------------
  const today = useMemo(() => new Date(), []);
  const currentMonthKey = getMonthKeyFromDate(today);

  const fromMonthKey = useMemo(() => {
    if (!currentMonthKey) return null;

    if (period === "last_12_months") return shiftMonthKey(currentMonthKey, -11);
    if (period === "last_6_months") return shiftMonthKey(currentMonthKey, -5);

    // year_to_date
    return `${today.getFullYear()}-01`;
  }, [period, currentMonthKey, today]);

  const from = fromMonthKey ? getMonthStartFromMonthKey(fromMonthKey) : null;
  const to = currentMonthKey ? getMonthEndFromMonthKey(currentMonthKey) : null;

  // color línea por categoría
  const lineColor = useMemo(() => {
    if (category === "all") return "rgba(255,255,255,0.90)";
    if (!isCategoryId(category)) return "rgba(255,255,255,0.90)";
    return CATEGORIES[category].color;
  }, [category]);

  // -----------------------
  // Fetch (1 sola llamada)
  // -----------------------
  useEffect(() => {
    if (!from || !to) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/expenses?from=${from}&to=${to}`);
        if (!res.ok) throw new Error("Error cargando gastos");

        const data = (await res.json()) as ApiExpense[];

        if (cancelled) return;

        const safe = Array.isArray(data) ? data : [];
        setApiExpenses(safe);

        setExpenses(
          safe.map((e) => ({
            date: e.date,
            amount: e.amount,
            categoryId: e.categoryId,
          }))
        );
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Error desconocido");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  // -----------------------
  // Moneda + language
  // -----------------------
  const currency = useMemo(() => {
    const apiCurrency = apiExpenses?.[0]?.currency?.toUpperCase?.();
    return apiCurrency ?? (fallbackCurrency?.toUpperCase?.() ?? "COP");
  }, [apiExpenses, fallbackCurrency]);

  const language = useMemo(() => {
    return fallbackLanguage ?? "es-CO";
  }, [fallbackLanguage]);

  // -----------------------
  // Copy dinámico
  // -----------------------
  const categoryLabel = useMemo(() => {
    if (category === "all") return null;
    return isCategoryId(category) ? CATEGORIES[category].label : null;
  }, [category]);

  // -----------------------
  // Analytics
  // -----------------------
  const evolution = useMemo(() => {
    return computeMonthlyEvolution({
      expenses,
      period:
        period === "year_to_date"
          ? "year_to_date"
          : period === "last_12_months"
          ? "last_12_months"
          : "last_6_months",
      categoryId: category,
    });
  }, [expenses, period, category]);

  // -----------------------
  // Headline
  // -----------------------
  const headline = useMemo(() => {
    const hc = evolution.headlineComparison;
    if (!hc) return null;

    const currentLabel = hc.currentLabel ?? "Último mes cerrado";
    const prevLabel = hc.prevLabel ?? "mes anterior";

    return {
      currentLabel,
      prevLabel,
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

      {loading && <p className="text-sm text-white/70">Cargando…</p>}
      {!loading && error && <p className="text-sm text-red-300">{error}</p>}

      {!loading && !error && (
        <MonthlyEvolutionLineChart
          series={evolution.series}
          monthDeltaPctByMonthKey={evolution.monthDeltaPctByMonthKey}
          inProgressMonthKey={evolution.inProgressMonthKey}
          currency={currency}
          language={language} // ✅ pásalo
          lineColor={lineColor}
        />
      )}
    </div>
  );
}
