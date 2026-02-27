// src/lib/analytics/pace.ts
// -----------------------------------------------------------------------------
// Ritmo del mes (Capa 1B – v2)
//
// ✅ Este archivo queda SOLO cálculo (analytics).
//
// Qué calcula:
// - Series diarias (totales/acumulado) del mes seleccionado.
// - Baseline por mediana usando hasta 3 meses previos válidos (consecutivos).
// - Índice R, delta%, status y confidence.
// - Dataset listo para gráfico: day | actual | baseline
//
// Qué NO hace:
// - NO genera textos.
// - NO conoce UI.
// - NO sabe si esto se mostrará en canal o web.
//
// NOTA: No cambiamos la lógica; solo aseguramos que este módulo sea “puro”
// para que el insight viva aparte (como Tercios).
// -----------------------------------------------------------------------------

import type { ExpenseForAnalytics } from "@/lib/analytics/tercios";
import {
  getMonthKeyFromYYYYMMDD,
  getDayFromYYYYMMDD,
  getDaysInMonthFromMonthKey,
  shiftMonthKey,
} from "@/lib/analytics/dates";

// -----------------------------------------------------------------------------
// Tipos de salida
// -----------------------------------------------------------------------------

export type PaceConfidence = "sin_referencia" | "preliminar" | "solida";
export type PaceStatus = "contenido" | "normal" | "acelerado";

export type MonthPaceChartPoint = {
  day: number;        // 1..D
  actual: number;     // acumulado del mes seleccionado
  baseline?: number;  // acumulado baseline (si existe)
};

export type MonthPaceResult = {
  selectedMonthKey: string; // "YYYY-MM"
  dayLimit: number;

  actualToDay: number;
  baselineToDay: number | null;
  avgDailyActual: number;

  R: number | null;
  deltaPct: number | null;

  status: PaceStatus | null;
  confidence: PaceConfidence;
  baselineMonthsUsed: string[];

  meta: {
    validMonthsFound: number;
    reasonsNoBaseline?: string[];
  };

  chart: MonthPaceChartPoint[];
};

// -----------------------------------------------------------------------------
// Configuración
// -----------------------------------------------------------------------------

export type MonthPaceConfig = {
  minActiveDays: number;
  maxFirstExpenseDay: number;
  thresholdContenido: number;
  thresholdAcelerado: number;
  maxBaselineMonths: 1 | 2 | 3;
};

export const DEFAULT_MONTH_PACE_CONFIG: MonthPaceConfig = {
  minActiveDays: 8,
  maxFirstExpenseDay: 15,
  thresholdContenido: 0.9,
  thresholdAcelerado: 1.1,
  maxBaselineMonths: 3,
};

// -----------------------------------------------------------------------------
// Tipos internos
// -----------------------------------------------------------------------------

type MonthSeries = {
  monthKey: string;
  daysInMonth: number;
  dailyTotals: number[];      // [0..daysInMonth] (index 0 unused)
  dailyCumulative: number[];  // [0..daysInMonth] (index 0 unused)
  activeDays: number;
  firstDayWithExpense: number | null;
};

// -----------------------------------------------------------------------------
// Helpers internos
// -----------------------------------------------------------------------------

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function median(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function isValidMonthForBaseline(series: MonthSeries, cfg: MonthPaceConfig): boolean {
  if (series.activeDays < cfg.minActiveDays) return false;
  if (series.firstDayWithExpense == null) return false;
  if (series.firstDayWithExpense > cfg.maxFirstExpenseDay) return false;
  return true;
}

function buildMonthSeries(monthKey: string, expenses: ExpenseForAnalytics[]): MonthSeries | null {
  const daysInMonth = getDaysInMonthFromMonthKey(monthKey);
  if (!daysInMonth) return null;

  const dailyTotals = new Array(daysInMonth + 1).fill(0);
  const dailyCumulative = new Array(daysInMonth + 1).fill(0);

  const daySet = new Set<number>();
  let firstDay: number | null = null;

  for (const e of expenses) {
    const day = getDayFromYYYYMMDD(e.date);
    if (day == null) continue;
    if (day < 1 || day > daysInMonth) continue;

    const amt = Number(e.amount);
    if (!Number.isFinite(amt) || amt <= 0) continue;

    dailyTotals[day] += amt;
    daySet.add(day);

    if (firstDay == null || day < firstDay) firstDay = day;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    dailyCumulative[d] = dailyCumulative[d - 1] + dailyTotals[d];
  }

  return {
    monthKey,
    daysInMonth,
    dailyTotals,
    dailyCumulative,
    activeDays: daySet.size,
    firstDayWithExpense: firstDay,
  };
}

function groupExpensesByMonth(expenses: ExpenseForAnalytics[]): Map<string, ExpenseForAnalytics[]> {
  const map = new Map<string, ExpenseForAnalytics[]>();

  for (const e of expenses ?? []) {
    const mk = getMonthKeyFromYYYYMMDD(e.date);
    if (!mk) continue;

    if (!map.has(mk)) map.set(mk, []);
    map.get(mk)!.push(e);
  }

  return map;
}

// -----------------------------------------------------------------------------
// Función principal
// -----------------------------------------------------------------------------

export function computeMonthPace(args: {
  expenses: ExpenseForAnalytics[];
  selectedMonthKey: string; // "YYYY-MM"
  dayLimit: number;
  config?: Partial<MonthPaceConfig>;
}): MonthPaceResult | null {
  const cfg: MonthPaceConfig = { ...DEFAULT_MONTH_PACE_CONFIG, ...(args.config ?? {}) };

  if (!args.selectedMonthKey || !/^\d{4}-\d{2}$/.test(args.selectedMonthKey)) {
    return null;
  }

  const byMonth = groupExpensesByMonth(args.expenses ?? []);

  const selectedExpenses = byMonth.get(args.selectedMonthKey) ?? [];
  const selectedSeries = buildMonthSeries(args.selectedMonthKey, selectedExpenses);
  if (!selectedSeries) return null;

  const D = clamp(Math.trunc(args.dayLimit), 1, selectedSeries.daysInMonth);

  const actualToDay = selectedSeries.dailyCumulative[D];
  const avgDailyActual = D > 0 ? actualToDay / D : 0;

  // 1) Selección de meses baseline (consecutivos previos)
  const baselineMonths: string[] = [];
  for (let i = 1; i <= cfg.maxBaselineMonths; i++) {
    const mk = shiftMonthKey(args.selectedMonthKey, -i);
    if (mk) baselineMonths.push(mk);
  }

  const validBaselineSeries: MonthSeries[] = [];
  for (const mk of baselineMonths) {
    const exp = byMonth.get(mk);
    if (!exp || exp.length === 0) continue;

    const series = buildMonthSeries(mk, exp);
    if (!series) continue;

    if (isValidMonthForBaseline(series, cfg)) {
      validBaselineSeries.push(series);
    }
  }

  // Confianza
  let confidence: PaceConfidence = "sin_referencia";
  if (validBaselineSeries.length >= 2) confidence = "solida";
  else if (validBaselineSeries.length === 1) confidence = "preliminar";

  // 2) Construcción de baseline acumulado por día (1..D)
  let baselineCumulative: number[] | null = null;
  let baselineToDay: number | null = null;

  const reasonsNoBaseline: string[] = [];

  if (validBaselineSeries.length === 0) {
    reasonsNoBaseline.push("No hay meses previos válidos para baseline.");
  } else {
    baselineCumulative = new Array(D + 1).fill(0);

    for (let d = 1; d <= D; d++) {
      const values: number[] = [];
      for (const s of validBaselineSeries) {
        const dRef = Math.min(d, s.daysInMonth);
        values.push(s.dailyCumulative[dRef]);
      }
      baselineCumulative[d] = median(values);
    }

    baselineToDay = baselineCumulative[D] ?? null;
  }

  // 3) Cálculo de R, delta y status
  let R: number | null = null;
  let deltaPct: number | null = null;
  let status: PaceStatus | null = null;

  if (baselineToDay != null && baselineToDay > 0) {
    R = actualToDay / baselineToDay;
    deltaPct = (R - 1) * 100;

    if (R < cfg.thresholdContenido) status = "contenido";
    else if (R > cfg.thresholdAcelerado) status = "acelerado";
    else status = "normal";
  }

  // 4) Dataset para gráfico
  const chart: MonthPaceChartPoint[] = [];
  for (let d = 1; d <= D; d++) {
    const point: MonthPaceChartPoint = {
      day: d,
      actual: selectedSeries.dailyCumulative[d],
    };
    if (baselineCumulative) point.baseline = baselineCumulative[d];
    chart.push(point);
  }

  const baselineMonthsUsed = validBaselineSeries.map((s) => s.monthKey);

  return {
    selectedMonthKey: args.selectedMonthKey,
    dayLimit: D,

    actualToDay,
    baselineToDay,
    avgDailyActual,

    R,
    deltaPct,

    status,
    confidence,
    baselineMonthsUsed,

    meta: {
      validMonthsFound: validBaselineSeries.length,
      reasonsNoBaseline: reasonsNoBaseline.length ? reasonsNoBaseline : undefined,
    },

    chart,
  };
}