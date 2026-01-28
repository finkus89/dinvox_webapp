// src/lib/analytics/pace.ts
// -----------------------------------------------------------------------------
// Ritmo del mes (Capa 1B – v1)
//
// Qué calcula este módulo:
// - Construye series diarias (totales y acumulado) para un mes seleccionado.
// - Selecciona un baseline basado en hasta 3 meses consecutivos previos "válidos".
// - Calcula el índice R (ritmo), el delta %, el estado y el nivel de confianza.
// - Genera un dataset listo para un mini gráfico de líneas:
//
//   day | actual | baseline
//
// Qué NO hace:
// - NO hace fetch.
// - NO conoce UI.
// - NO conoce Supabase.
// - NO genera frases (eso irá en insights/UI).
//
// Qué usa:
// - ExpenseForAnalytics: { date: "YYYY-MM-DD", amount: number }
// - Helpers de dates.ts añadidos:
//   - getMonthKeyFromYYYYMMDD, getDayFromYYYYMMDD,
//   - getDaysInMonthFromMonthKey, shiftMonthKey
//
// Cómo se llama desde UI (ejemplo):
//   const result = computeMonthPace({ expenses, selectedMonthKey, dayLimit, config })
//
// Este módulo se usará en:
// - MonthRhythmCard (nuevo)
// - Futuras cards que requieran series temporales (presión, proyección, etc.)
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
  // Mes analizado
  selectedMonthKey: string; // "YYYY-MM"

  // Día límite usado para el cálculo (para mes actual normalmente es "hoy",
  // para mes anterior normalmente es fin de mes).
  dayLimit: number;

  // Totales
  actualToDay: number;          // acumulado del mes seleccionado a día dayLimit
  baselineToDay: number | null; // acumulado baseline a día equivalente
  avgDailyActual: number;       // actualToDay / dayLimit (si dayLimit>0)

  // Índices
  R: number | null;        // actualToDay / baselineToDay (si baseline existe)
  deltaPct: number | null; // (R - 1) * 100

  // Clasificación
  status: PaceStatus | null;
  confidence: PaceConfidence;
  baselineMonthsUsed: string[]; // monthKeys usados para baseline (0..3)

  // Metadatos de calidad (útil para debug o para mostrar en tooltip)
  meta: {
    validMonthsFound: number;
    reasonsNoBaseline?: string[]; // explicaciones técnicas (para dev/debug)
  };

  // Dataset para gráfico
  chart: MonthPaceChartPoint[];
};

// -----------------------------------------------------------------------------
// Configuración (umbral y reglas de validez)
// -----------------------------------------------------------------------------

export type MonthPaceConfig = {
  // Regla de "mes válido" para poder usarlo como baseline
  minActiveDays: number;        // ej 8
  maxFirstExpenseDay: number;   // ej 15 (primer gasto debe ser <= 15)

  // Umbrales para estado según R
  thresholdContenido: number;   // ej 0.90
  thresholdAcelerado: number;   // ej 1.10

  // Cuántos meses previos consecutivos intentamos usar (máx 3)
  maxBaselineMonths: 1 | 2 | 3;
};

// Defaults recomendados (acordados)
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

  // dailyTotals[1..daysInMonth] (index 0 unused)
  dailyTotals: number[];
  // dailyCumulative[1..daysInMonth] (index 0 unused)
  dailyCumulative: number[];

  // calidad / cobertura
  activeDays: number;
  firstDayWithExpense: number | null;
};

// -----------------------------------------------------------------------------
// Helpers internos
// -----------------------------------------------------------------------------

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Mediana de un array de números (asume length >= 1)
function median(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

// Determina si un mes es válido para baseline según reglas acordadas
function isValidMonthForBaseline(series: MonthSeries, cfg: MonthPaceConfig): boolean {
  if (series.activeDays < cfg.minActiveDays) return false;
  if (series.firstDayWithExpense == null) return false;
  if (series.firstDayWithExpense > cfg.maxFirstExpenseDay) return false;
  return true;
}

// Construye MonthSeries para un monthKey específico a partir de gastos ya agrupados
function buildMonthSeries(monthKey: string, expenses: ExpenseForAnalytics[]): MonthSeries | null {
  const daysInMonth = getDaysInMonthFromMonthKey(monthKey);
  if (!daysInMonth) return null;

  // index 0 se deja en 0 para facilitar uso day=1..N
  const dailyTotals = new Array(daysInMonth + 1).fill(0);
  const dailyCumulative = new Array(daysInMonth + 1).fill(0);

  const daySet = new Set<number>();
  let firstDay: number | null = null;

  for (const e of expenses) {
    const day = getDayFromYYYYMMDD(e.date);
    if (day == null) continue;

    // si por algún bug llega un día fuera del mes (ej 31 en mes de 30)
    // lo ignoramos para no romper series
    if (day < 1 || day > daysInMonth) continue;

    const amt = Number(e.amount);
    if (!Number.isFinite(amt) || amt <= 0) continue;

    dailyTotals[day] += amt;
    daySet.add(day);

    if (firstDay == null || day < firstDay) firstDay = day;
  }

  // acumulado
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

// Agrupa gastos por monthKey "YYYY-MM"
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
  // Gastos en un rango amplio (ideal: mes seleccionado + 3 previos)
  expenses: ExpenseForAnalytics[];

  // Mes que se está analizando (por UI: actual o anterior)
  selectedMonthKey: string; // "YYYY-MM"

  // Día límite para el cálculo y gráfico:
  // - Mes actual: normalmente hoy (1..31)
  // - Mes anterior: normalmente fin de mes
  dayLimit: number;

  // Config opcional
  config?: Partial<MonthPaceConfig>;
}): MonthPaceResult | null {
  const cfg: MonthPaceConfig = { ...DEFAULT_MONTH_PACE_CONFIG, ...(args.config ?? {}) };

  if (!args.selectedMonthKey || !/^\d{4}-\d{2}$/.test(args.selectedMonthKey)) {
    return null;
  }

  // Agrupar gastos por mes
  const byMonth = groupExpensesByMonth(args.expenses ?? []);

  // Serie del mes seleccionado
  const selectedExpenses = byMonth.get(args.selectedMonthKey) ?? [];
  const selectedSeries = buildMonthSeries(args.selectedMonthKey, selectedExpenses);
  if (!selectedSeries) return null;

  // dayLimit clamped al tamaño del mes seleccionado
  const D = clamp(Math.trunc(args.dayLimit), 1, selectedSeries.daysInMonth);

  // acumulado actual a día D
  const actualToDay = selectedSeries.dailyCumulative[D];
  const avgDailyActual = D > 0 ? actualToDay / D : 0;

  // ----------------------------------------------------------
  // 1) Selección de meses baseline (consecutivos previos)
  // ----------------------------------------------------------
  const baselineMonths: string[] = [];
  const reasonsNoBaseline: string[] = [];

  for (let i = 1; i <= cfg.maxBaselineMonths; i++) {
    const mk = shiftMonthKey(args.selectedMonthKey, -i);
    if (!mk) continue;
    baselineMonths.push(mk);
  }

  // Filtramos solo los que existan en data y sean válidos
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

  // Definimos confianza según cantidad de meses válidos encontrados
  let confidence: PaceConfidence = "sin_referencia";
  if (validBaselineSeries.length >= 2) confidence = "solida";
  else if (validBaselineSeries.length === 1) confidence = "preliminar";

  // ----------------------------------------------------------
  // 2) Construcción de baseline acumulado por día (1..D)
  // ----------------------------------------------------------
  let baselineCumulative: number[] | null = null;
  let baselineToDay: number | null = null;

  if (validBaselineSeries.length === 0) {
    reasonsNoBaseline.push("No hay meses previos válidos para baseline.");
  } else {
    // baselineCumulative[d] = mediana de acumulados a día equivalente
    baselineCumulative = new Array(D + 1).fill(0); // index 0 unused

    for (let d = 1; d <= D; d++) {
      const values: number[] = [];

      for (const s of validBaselineSeries) {
        // día equivalente para ese mes (si el mes tiene menos días)
        const dRef = Math.min(d, s.daysInMonth);
        values.push(s.dailyCumulative[dRef]);
      }

      baselineCumulative[d] = median(values);
    }

    baselineToDay = baselineCumulative[D] ?? null;
  }

  // ----------------------------------------------------------
  // 3) Cálculo de R, delta y status
  // ----------------------------------------------------------
  let R: number | null = null;
  let deltaPct: number | null = null;
  let status: PaceStatus | null = null;

  if (baselineToDay != null && baselineToDay > 0) {
    R = actualToDay / baselineToDay;
    deltaPct = (R - 1) * 100;

    if (R < cfg.thresholdContenido) status = "contenido";
    else if (R > cfg.thresholdAcelerado) status = "acelerado";
    else status = "normal";
  } else {
    // No baseline usable => sin comparación
    R = null;
    deltaPct = null;
    status = null;
  }

  // ----------------------------------------------------------
  // 4) Dataset para gráfico
  // ----------------------------------------------------------
  const chart: MonthPaceChartPoint[] = [];

  for (let d = 1; d <= D; d++) {
    const point: MonthPaceChartPoint = {
      day: d,
      actual: selectedSeries.dailyCumulative[d],
    };

    if (baselineCumulative) {
      point.baseline = baselineCumulative[d];
    }

    chart.push(point);
  }

  // Lista final de baselineMonthKeys realmente usados (válidos)
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
