// src/lib/analytics/insights/monthlyEvolution.ts
// -----------------------------------------------------------------------------
// INSIGHT: Evolución mensual (v2)
// -----------------------------------------------------------------------------
// Este módulo NO calcula series ni totales.
// Solo interpreta el resultado de computeMonthlyEvolution y arma lo que la UI
// necesita para renderizar:
//
// - Headline: último mes cerrado vs anterior (ya lo calcula evolution.ts)
// - Drivers por categoría (solo si categoryId === "all"):
//    • Top 2 que más subieron (deltaAmount > 0) por monto ABSOLUTO
//    • Top 2 que más bajaron (deltaAmount < 0) por monto ABSOLUTO
//
// Reglas (acordadas):
// - NO usamos peso 8%.
// - NO usamos “impact”.
// - Ranking = diferencia en dinero (deltaAmount).
// - Se incluyen categorías que “aparecen” (0 -> X) o “desaparecen” (X -> 0),
//   porque evolution.ts ya entrega la unión de categorías entre ambos meses.
// - Si no hay headline o categoryId !== "all" => solo headline, sin drivers.
// -----------------------------------------------------------------------------

import type { MonthlyEvolutionResult } from "@/lib/analytics/evolution";
import { CATEGORIES, type CategoryId } from "@/lib/dinvox/categories";

const MAX_ITEMS = 2;

export type CategoryDriver = {
  categoryId: CategoryId;
  label: string;
  emoji?: string;
  deltaAmount: number;
};

export type MonthlyEvolutionInsight = {
  headline: {
    currentLabel: string;
    prevLabel: string;
    currentTotal: number;
    deltaPct: number | null;
  } | null;

  topUp: CategoryDriver[];
  topDown: CategoryDriver[];
};

export function buildMonthlyEvolutionInsight(
  evolution: MonthlyEvolutionResult,
  categoryId: CategoryId | "all"
): MonthlyEvolutionInsight {
  const hc = evolution?.headlineComparison;

  const headline = hc
    ? {
        currentLabel: hc.currentLabel ?? "Último mes cerrado",
        prevLabel: hc.prevLabel ?? "mes anterior",
        currentTotal: hc.currentTotal,
        deltaPct: hc.deltaPct ?? null,
      }
    : null;

  // Si no hay headline (no hay 2 meses cerrados) o estamos filtrando una categoría,
  // no mostramos drivers (se mantiene UX como hoy).
  if (!hc || categoryId !== "all") {
    return { headline, topUp: [], topDown: [] };
  }

  const comps = Array.isArray(evolution.categoryComparisons)
    ? evolution.categoryComparisons
    : [];

  // Ranking por dinero absoluto (deltaAmount), pero separados por signo.
  const up = comps
    .filter((c) => Number.isFinite(c.deltaAmount) && c.deltaAmount > 0)
    .sort((a, b) => Math.abs(b.deltaAmount) - Math.abs(a.deltaAmount))
    .slice(0, MAX_ITEMS)
    .map((c) => ({
      categoryId: c.categoryId,
      label: CATEGORIES[c.categoryId]?.label ?? c.categoryId,
      emoji: CATEGORIES[c.categoryId]?.emoji,
      deltaAmount: c.deltaAmount,
    }));

  const down = comps
    .filter((c) => Number.isFinite(c.deltaAmount) && c.deltaAmount < 0)
    .sort((a, b) => Math.abs(b.deltaAmount) - Math.abs(a.deltaAmount))
    .slice(0, MAX_ITEMS)
    .map((c) => ({
      categoryId: c.categoryId,
      label: CATEGORIES[c.categoryId]?.label ?? c.categoryId,
      emoji: CATEGORIES[c.categoryId]?.emoji,
      deltaAmount: c.deltaAmount,
    }));

  return {
    headline,
    topUp: up,
    topDown: down,
  };
}