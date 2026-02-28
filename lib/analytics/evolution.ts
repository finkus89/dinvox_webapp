// src/lib/analytics/evolution.ts
// -----------------------------------------------------------------------------
// ANALYTICS: Evolución mensual (serie mes-a-mes + comparaciones)
// -----------------------------------------------------------------------------
// CÁLCULO PURO (sin React, sin fetch, sin UI).
//
// Qué hace este módulo:
//
// 1) Construye la serie mensual para el gráfico:
//    - Total mensual (o total mensual por una categoría si se filtra).
//    - Incluye meses vacíos como 0 (serie continua).
//
// 2) Identifica el mes en curso (inProgressMonthKey):
//    - El mes en curso NO participa en comparaciones (%) para evitar conclusiones
//      engañosas con el mes incompleto.
//
// 3) Calcula comparación fija (headline):
//    - Último mes CERRADO vs su mes anterior (ambos cerrados).
//    - Si no hay 2 meses cerrados => headlineComparison = null.
//
// 4) Calcula delta mes-a-mes para tooltip:
//    - Para cada mes cerrado, delta% vs su mes anterior cerrado.
//    - Si el mes anterior es 0 => deltaPct = null (evita infinito).
//    - Mes en curso => null.
//
// 5) NUEVO: Expone comparaciones por categoría (crudas, SIN reglas de negocio):
//    - Solo cuando categoryId === "all".
//    - Compara ÚLTIMO mes cerrado vs anterior.
//    - Incluye TODAS las categorías presentes en cualquiera de los 2 meses.
//      (Esto es crucial para detectar:
//       • "Regalos: 763k -> 0"
//       • "Salud: 0 -> 550k")
//    - No decide qué mostrar (top2, filtros, etc). Eso vive en insights.
//
// -----------------------------------------------------------------------------
// ⚠️ Este archivo NO decide:
// - Qué categorías mostrar.
// - Umbrales/pesos.
// - Top N.
// Todo eso vive en insights/monthlyEvolution.ts
// -----------------------------------------------------------------------------

import type { CategoryId } from "@/lib/dinvox/categories";
import {
  getMonthKeyFromYYYYMMDD,
  getMonthKeyFromDate,
  getMonthLabelEsFromMonthKey,
  getLastNMonthKeys,
  getYearToDateMonthKeys,
} from "@/lib/analytics/dates";

// -----------------------------------------------------------------------------
// Tipos
// -----------------------------------------------------------------------------

export type MonthlyEvolutionPeriod =
  | "last_12_months"
  | "last_6_months"
  | "year_to_date";

export type ExpenseForEvolution = {
  id?: string;
  date: string; // "YYYY-MM-DD"
  categoryId: CategoryId;
  amount: number;
};

export type MonthlyPoint = {
  monthKey: string; // "YYYY-MM"
  label: string; // "Ene 2026"
  total: number; // 0 si no hubo gastos
};

export type MonthToMonthComparison = {
  currentMonthKey: string;
  previousMonthKey: string;

  currentLabel: string; // "Ene 2026"
  prevLabel: string; // "Dic 2025"

  currentTotal: number;
  previousTotal: number;
  deltaAmount: number;
  deltaPct: number | null; // null si previousTotal = 0
};

// Comparación cruda por categoría entre:
// - currentMonthKey (último mes cerrado)
// - previousMonthKey (mes anterior al cerrado)
export type CategoryMonthComparison = {
  categoryId: CategoryId;
  currentTotal: number;
  previousTotal: number;
  deltaAmount: number;

  // Mantengo este campo porque te puede servir luego.
  // (Si quieres limpiarlo más adelante, se puede remover sin afectar el gráfico.)
  shareOfCurrentMonth: number; // currentTotal / currentMonthTotal
};

export type MonthlyEvolutionResult = {
  // Serie lista para el chart
  series: MonthlyPoint[];

  // Mes en curso (para que UI lo etiquete "Mes en curso")
  inProgressMonthKey: string;

  // Headline: último mes cerrado vs anterior
  headlineComparison: MonthToMonthComparison | null;

  // Deltas % para tooltip (mes cerrado vs mes anterior cerrado)
  monthDeltaPctByMonthKey: Record<string, number | null>;

  // Comparaciones crudas por categoría (solo si categoryId === "all")
  categoryComparisons: CategoryMonthComparison[];
};

// -----------------------------------------------------------------------------
// Helpers internos
// -----------------------------------------------------------------------------

function safePctChange(current: number, previous: number): number | null {
  // Regla: si el mes anterior es 0 => NO devolvemos % (evita infinito)
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function buildMonthKeyList(period: MonthlyEvolutionPeriod, today: Date): string[] {
  const anchor = getMonthKeyFromDate(today); // mes actual (in-progress)
  if (period === "last_12_months") return getLastNMonthKeys(anchor, 12);
  if (period === "last_6_months") return getLastNMonthKeys(anchor, 6);
  return getYearToDateMonthKeys(anchor);
}

function groupMonthlyTotals(
  expenses: ExpenseForEvolution[],
  categoryId: CategoryId | "all"
): Record<string, number> {
  const totals: Record<string, number> = {};

  for (const e of expenses ?? []) {
    if (!e?.date) continue;
    if (!Number.isFinite(e.amount)) continue;

    // Si se filtra por una categoría específica, solo sumar esa
    if (categoryId !== "all" && e.categoryId !== categoryId) continue;

    const mk = getMonthKeyFromYYYYMMDD(e.date);
    if (!mk) continue;

    totals[mk] = (totals[mk] ?? 0) + e.amount;
  }

  return totals;
}

function groupCategoryTotalsForMonth(
  expenses: ExpenseForEvolution[],
  monthKey: string
): Record<CategoryId, number> {
  // Usamos Record<string, number> y luego casteamos a Record<CategoryId, number>
  // porque las claves llegan dinámicas. Los CategoryId ya vienen validados upstream.
  const out: Record<string, number> = {};

  for (const e of expenses ?? []) {
    if (!e?.date) continue;
    if (!Number.isFinite(e.amount)) continue;

    const mk = getMonthKeyFromYYYYMMDD(e.date);
    if (mk !== monthKey) continue;

    out[e.categoryId] = (out[e.categoryId] ?? 0) + e.amount;
  }

  return out as Record<CategoryId, number>;
}

// -----------------------------------------------------------------------------
// API pública
// -----------------------------------------------------------------------------

export function computeMonthlyEvolution(args: {
  expenses: ExpenseForEvolution[];
  period: MonthlyEvolutionPeriod;
  categoryId: CategoryId | "all";
  today?: Date;
}): MonthlyEvolutionResult {
  const today = args.today ?? new Date();

  // Mes en curso (NO cerrado)
  const inProgressMonthKey = getMonthKeyFromDate(today);

  // Lista de meses para el rango (incluye el mes en curso)
  const monthKeys = buildMonthKeyList(args.period, today);

  // Totales por mes (respetando filtro categoryId)
  const totalsByMonthKey = groupMonthlyTotals(args.expenses ?? [], args.categoryId);

  // Serie continua (meses sin datos = 0)
  const series: MonthlyPoint[] = monthKeys.map((mk) => ({
    monthKey: mk,
    label: getMonthLabelEsFromMonthKey(mk) ?? mk,
    total: totalsByMonthKey[mk] ?? 0,
  }));

  // -----------------------
  // Headline: último mes cerrado vs anterior
  // -----------------------
  const closed = series.filter((p) => p.monthKey !== inProgressMonthKey);

  const headlineComparison: MonthToMonthComparison | null =
    closed.length >= 2
      ? (() => {
          const current = closed[closed.length - 1];
          const previous = closed[closed.length - 2];

          return {
            currentMonthKey: current.monthKey,
            previousMonthKey: previous.monthKey,
            currentLabel: current.label,
            prevLabel: previous.label,
            currentTotal: current.total,
            previousTotal: previous.total,
            deltaAmount: current.total - previous.total,
            deltaPct: safePctChange(current.total, previous.total),
          };
        })()
      : null;

  // -----------------------
  // Tooltip deltas: % vs mes anterior (solo meses cerrados)
  // -----------------------
  const monthDeltaPctByMonthKey: Record<string, number | null> = {};

  series.forEach((p, i) => {
    // Mes en curso o primer mes: no hay comparación
    if (p.monthKey === inProgressMonthKey || i === 0) {
      monthDeltaPctByMonthKey[p.monthKey] = null;
      return;
    }

    const prev = series[i - 1];

    // Si el mes anterior es el mes en curso (seguridad), no calculamos
    if (prev.monthKey === inProgressMonthKey) {
      monthDeltaPctByMonthKey[p.monthKey] = null;
      return;
    }

    monthDeltaPctByMonthKey[p.monthKey] = safePctChange(p.total, prev.total);
  });

  // -----------------------
  // Comparaciones por categoría (crudas)
  // Solo si:
  // - hay headlineComparison (hay 2 meses cerrados)
  // - y estamos en "all" (si el usuario filtra por categoría, no aplica)
  // -----------------------
  let categoryComparisons: CategoryMonthComparison[] = [];

  if (headlineComparison && args.categoryId === "all") {
    const currentTotals = groupCategoryTotalsForMonth(
      args.expenses,
      headlineComparison.currentMonthKey
    );
    const previousTotals = groupCategoryTotalsForMonth(
      args.expenses,
      headlineComparison.previousMonthKey
    );

    const totalMonth = headlineComparison.currentTotal;

    // ✅ CLAVE: unión de categorías entre ambos meses
    // (para capturar categorías que desaparecieron o aparecieron)
    const categorySet = new Set<CategoryId>([
      ...(Object.keys(currentTotals) as CategoryId[]),
      ...(Object.keys(previousTotals) as CategoryId[]),
    ]);

    categoryComparisons = Array.from(categorySet).map((categoryId) => {
      const currentTotal = currentTotals[categoryId] ?? 0;
      const previousTotal = previousTotals[categoryId] ?? 0;

      return {
        categoryId,
        currentTotal,
        previousTotal,
        deltaAmount: currentTotal - previousTotal,
        shareOfCurrentMonth: totalMonth > 0 ? currentTotal / totalMonth : 0,
      };
    });
  }

  return {
    series,
    inProgressMonthKey,
    headlineComparison,
    monthDeltaPctByMonthKey,
    categoryComparisons,
  };
}