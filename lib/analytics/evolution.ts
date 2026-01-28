// src/lib/analytics/evolution.ts
// -----------------------------------------------------------------------------
// ANALYTICS: Evolución mensual (serie mes-a-mes + comparaciones)
// -----------------------------------------------------------------------------
// Este módulo hace CÁLCULO PURO (sin React, sin fetch, sin UI).
//
// Objetivo:
// - Construir la serie mensual para el line chart (Total o por categoría)
// - Incluir meses sin gastos como 0 (serie continua)
// - Marcar el mes en curso (mes actual del calendario) para que la UI lo etiquete
// - Calcular:
//   A) comparación fija: último mes CERRADO vs su mes anterior (también cerrado)
//   B) comparación mes-a-mes para tooltips (solo meses cerrados)
//
// Reglas clave:
// - El mes en curso NO participa en comparaciones (%).
// - Si el mes anterior es 0, deltaPct = null (evita infinito/valores engañosos).
// - Si no hay suficientes meses cerrados, headlineComparison = null.
// -----------------------------------------------------------------------------

import {
  getMonthKeyFromYYYYMMDD,
  getMonthKeyFromDate,
  getMonthLabelEsFromMonthKey,
  getLastNMonthKeys,
  getYearToDateMonthKeys,
} from "@/lib/analytics/dates";

// -----------------------------------------------------------------------------
// Tipos de entrada (alineados a lo mínimo necesario)
// -----------------------------------------------------------------------------

export type MonthlyEvolutionPeriod = "last_12_months" | "last_6_months" | "year_to_date";

export type ExpenseForEvolution = {
  id?: string;
  date: string;        // "YYYY-MM-DD"
  categoryId: string;
  amount: number;
  currency?: string;   // viene del API (ej "COP")
  note?: string;
};


export type MonthlyPoint = {
  monthKey: string; // "YYYY-MM"
  label: string;    // "Ene 2026"
  total: number;    // total del mes (0 si no hubo gastos)
};

// Comparación entre 2 meses (usado para el “headline” fijo)
export type MonthToMonthComparison = {
  currentMonthKey: string;
  previousMonthKey: string;

  // 🔹 nuevos (para UI)
  currentLabel: string;   // ej: "Dic 2025"
  prevLabel: string;      // ej: "Nov 2025"

  currentTotal: number;
  previousTotal: number;
  deltaAmount: number;
  deltaPct: number | null; // null si previousTotal=0 (o no aplica)
};

export type MonthlyEvolutionResult = {
  // Serie lista para el chart
  series: MonthlyPoint[];

  // Mes en curso (para que la UI lo etiquete como “en curso”)
  inProgressMonthKey: string;

  // Comparación fija: último mes cerrado vs el anterior (ambos cerrados)
  headlineComparison: MonthToMonthComparison | null;

  // Cambios para tooltip:
  // - key = monthKey del mes consultado
  // - value = deltaPct vs mes anterior (solo si ambos son cerrados y previousTotal>0)
  // - null si no aplica (primer mes, mes en curso, o previousTotal=0)
  monthDeltaPctByMonthKey: Record<string, number | null>;
};

// -----------------------------------------------------------------------------
// Helpers internos
// -----------------------------------------------------------------------------

function safePctChange(current: number, previous: number): number | null {
  // Regla: si el mes anterior es 0, NO damos porcentaje (evita infinito)
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function buildMonthKeyList(period: MonthlyEvolutionPeriod, today: Date): string[] {
  const anchor = getMonthKeyFromDate(today); // mes actual
  if (period === "last_12_months") return getLastNMonthKeys(anchor, 12);
  if (period === "last_6_months") return getLastNMonthKeys(anchor, 6);
  return getYearToDateMonthKeys(anchor);
}

function isValidMonthKey(mk: string): boolean {
  return /^\d{4}-\d{2}$/.test(mk);
}

function groupMonthlyTotals(
  expenses: ExpenseForEvolution[],
  categoryId: string | "all"
): Record<string, number> {
  const totals: Record<string, number> = {};

  for (const e of expenses ?? []) {
    if (!e?.date) continue;
    if (typeof e.amount !== "number" || !Number.isFinite(e.amount)) continue;

    // Filtro de categoría (mismo comportamiento que tabla: "all" = todo)
    if (categoryId !== "all" && e.categoryId !== categoryId) continue;

    const mk = getMonthKeyFromYYYYMMDD(e.date);
    if (!mk) continue;

    totals[mk] = (totals[mk] ?? 0) + e.amount;
  }

  return totals;
}

function buildSeries(
  monthKeys: string[],
  totalsByMonthKey: Record<string, number>
): MonthlyPoint[] {
  const out: MonthlyPoint[] = [];

  for (const mk of monthKeys) {
    if (!isValidMonthKey(mk)) continue;

    const label = getMonthLabelEsFromMonthKey(mk) ?? mk;
    const total = totalsByMonthKey[mk] ?? 0;

    out.push({ monthKey: mk, label, total });
  }

  return out;
}

function computeHeadlineComparison(
  series: MonthlyPoint[],
  inProgressMonthKey: string
): MonthToMonthComparison | null {
  // Tomamos SOLO meses cerrados (excluimos el mes en curso)
  const closed = series.filter((p) => p.monthKey !== inProgressMonthKey);

  if (closed.length < 2) return null;

  const current = closed[closed.length - 1];
  const previous = closed[closed.length - 2];

  const deltaAmount = current.total - previous.total;
  const deltaPct = safePctChange(current.total, previous.total);

  return {
    currentMonthKey: current.monthKey,
    previousMonthKey: previous.monthKey,
    currentLabel: current.label,
    prevLabel: previous.label,
    currentTotal: current.total,
    previousTotal: previous.total,
    deltaAmount,
    deltaPct,
  };
}

function computeMonthDeltaPctMap(
  series: MonthlyPoint[],
  inProgressMonthKey: string
): Record<string, number | null> {
  const map: Record<string, number | null> = {};

  // Para tooltips: delta vs mes anterior SOLO si:
  // - mes actual (p) es cerrado
  // - mes anterior (prev) es cerrado
  // - prev.total != 0
  for (let i = 0; i < series.length; i++) {
    const p = series[i];
    const prev = i > 0 ? series[i - 1] : null;

    // Por defecto: null (sin comparación)
    map[p.monthKey] = null;

    // No calculamos para el mes en curso
    if (p.monthKey === inProgressMonthKey) continue;

    // No hay mes anterior
    if (!prev) continue;

    // Si el mes anterior es el mes en curso (caso raro, pero por seguridad)
    if (prev.monthKey === inProgressMonthKey) continue;

    // Porcentaje seguro (si prev.total=0 -> null)
    map[p.monthKey] = safePctChange(p.total, prev.total);
  }

  return map;
}

// -----------------------------------------------------------------------------
// API pública del módulo
// -----------------------------------------------------------------------------

// computeMonthlyEvolution
// -----------------------------------------------------------------------------
// Construye la serie mensual + comparaciones (headline + tooltip deltas).
//
// Parámetros:
// - expenses: gastos ya cargados (desde /api/expenses)
// - period: "last_3_months" | "last_6_months" | "year_to_date"
// - categoryId: "all" o un id de categoría (CategoryId)
// - today: Date opcional (útil para tests); default = new Date()
export function computeMonthlyEvolution(args: {
  expenses: ExpenseForEvolution[];
  period: MonthlyEvolutionPeriod;
  categoryId: string | "all";
  today?: Date;
}): MonthlyEvolutionResult {
  const today = args.today ?? new Date();

  // Mes en curso = mes actual del calendario (regla A confirmada)
  const inProgressMonthKey = getMonthKeyFromDate(today);

  // Lista de meses del rango (incluye mes en curso)
  const monthKeys = buildMonthKeyList(args.period, today);

  // Agrupar totales por mes (aplicando filtro de categoría)
  const totalsByMonthKey = groupMonthlyTotals(args.expenses ?? [], args.categoryId);

  // Serie continua (incluye 0 donde falte)
  const series = buildSeries(monthKeys, totalsByMonthKey);

  // Comparación fija: último mes cerrado vs anterior (ambos cerrados)
  const headlineComparison = computeHeadlineComparison(series, inProgressMonthKey);

  // Comparación mes-a-mes para tooltips (solo meses cerrados)
  const monthDeltaPctByMonthKey = computeMonthDeltaPctMap(series, inProgressMonthKey);

  return {
    series,
    inProgressMonthKey,
    headlineComparison,
    monthDeltaPctByMonthKey,
  };
}
