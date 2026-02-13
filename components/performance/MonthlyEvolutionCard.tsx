// src/components/performance/MonthlyEvolutionCard.tsx
// -----------------------------------------------------------------------------
// Dinvox | Card: Evolución mensual (Capa 1C)
//
// Objetivo:
// - Mostrar la evolución mes a mes del gasto (total o por categoría) en un rango:
//    • últimos 6 meses
//    • últimos 12 meses
//    • year-to-date
//
// Qué hace:
// 1) Calcula el rango (from/to) en base al período.
// 2) Descarga gastos reales con UNA llamada a `/api/expenses?from&to`.
// 3) Normaliza al input mínimo de analytics (date, amount, categoryId).
// 4) Calcula series e insights con `computeMonthlyEvolution()`.
// 5) Renderiza filtro de categoría + headline + gráfico.
//
// Moneda / idioma:
// - Fuente de verdad: AppContext (layout).
// - Respaldo: API (primer gasto) -> fallbacks -> default.
//
// Fetch:
// - Usa AbortController para evitar race conditions (cambio de período/unmount).
// -----------------------------------------------------------------------------

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

// ✅ contexto global (layout)
import { useAppContext } from "@/lib/dinvox/app-context";

// -----------------------
// Props
// -----------------------
type MonthlyEvolutionCardProps = {
  period: Extract<
    AnalysisPeriodValue,
    "last_6_months" | "last_12_months" | "year_to_date"
  >;
  fallbackCurrency?: string;
  fallbackLanguage?: string;
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

export default function MonthlyEvolutionCard({
  period,
  fallbackCurrency = "COP",
  fallbackLanguage = "es-CO",
  embedded = false,
}: MonthlyEvolutionCardProps) {
  // ✅ Hook SIEMPRE se llama (regla de hooks)
  const { currency: ctxCurrency, language: ctxLanguage } = useAppContext();

  // Datos crudos (para moneda real si existe)
  const [apiExpenses, setApiExpenses] = useState<ApiExpense[]>([]);
  // Input mínimo para analytics
  const [expenses, setExpenses] = useState<ExpenseForEvolution[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Categoría seleccionada (UI)
  const [category, setCategory] = useState<string | "all">("all");

  // -----------------------
  // Rango from / to
  // -----------------------
  // Nota: no lo memorizamos con [] porque en sesiones largas se queda “congelado”.
  const today = new Date();

  const currentMonthKey = useMemo(() => getMonthKeyFromDate(today), [today]);

  const fromMonthKey = useMemo(() => {
    if (!currentMonthKey) return null;

    if (period === "last_12_months") return shiftMonthKey(currentMonthKey, -11);
    if (period === "last_6_months") return shiftMonthKey(currentMonthKey, -5);

    // year_to_date
    return `${today.getFullYear()}-01`;
  }, [period, currentMonthKey, today]);

  const from = useMemo(
    () => (fromMonthKey ? getMonthStartFromMonthKey(fromMonthKey) : null),
    [fromMonthKey]
  );

  const to = useMemo(
    () => (currentMonthKey ? getMonthEndFromMonthKey(currentMonthKey) : null),
    [currentMonthKey]
  );

  // -----------------------
  // Color de la línea (si filtras por categoría)
  // - Si es "all" o algo inválido, usamos blanco.
  // - Si es categoría válida, tomamos color de taxonomía.
  // -----------------------
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

    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/expenses?from=${from}&to=${to}`, {
          method: "GET",
          signal: controller.signal,
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          const msg =
            payload?.error ??
            `Error al cargar gastos (${res.status} ${res.statusText}).`;
          throw new Error(msg);
        }

        const data = (await res.json()) as ApiExpense[];
        const safe = Array.isArray(data) ? data : [];

        setApiExpenses(safe);

        // Normalizamos al formato mínimo para analytics
        setExpenses(
          safe.map((e) => ({
            date: e.date,
            amount: e.amount,
            categoryId: e.categoryId,
          }))
        );
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message ?? "Error desconocido");
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [from, to]);

  // -----------------------
  // Moneda + language (source of truth)
  // -----------------------
  // currency: AppContext -> API(primer gasto) -> fallback -> default
  const currency = useMemo(() => {
    const apiCurrency = apiExpenses?.[0]?.currency?.toUpperCase?.();

    return (
      ctxCurrency?.toUpperCase?.() ??
      apiCurrency ??
      fallbackCurrency?.toUpperCase?.() ??
      "COP"
    );
  }, [ctxCurrency, apiExpenses, fallbackCurrency]);

  // language: AppContext -> fallback -> default (no uppercase)
  const language = ctxLanguage ?? fallbackLanguage ?? "es-CO";

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
  // Headline (comparación último mes cerrado vs anterior)
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
          language={language}
          lineColor={lineColor}
        />
      )}
    </div>
  );
}
