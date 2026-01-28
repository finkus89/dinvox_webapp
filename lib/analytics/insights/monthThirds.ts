// src/lib/analytics/insights/monthThirds.ts
// -----------------------------------------------------------------------------
// Builder de insight para la card "Tercios del mes".
//
// (comentarios de cabecera iguales a los tuyos, omitidos aquí por brevedad)
// -----------------------------------------------------------------------------

import type { MonthThirdsMetrics } from "@/lib/analytics/tercios";

export type MonthThirdsInsight = {
  headline: string;
  note?: string;
};

type Period = "current_month" | "previous_month";
type ThirdKey = "T1" | "T2" | "T3";

type ThirdPct = {
  key: ThirdKey;
  pct: number;
};

export function buildMonthThirdsInsight(args: {
  metrics: MonthThirdsMetrics | null;
  period: Period;
  monthLabel: string;
}): MonthThirdsInsight {
  const { metrics, period, monthLabel } = args;

  // 1) Sin datos
  if (!metrics || metrics.totalMonth <= 0) {
    return { headline: "No hay gastos registrados en este período." };
  }

  const { pctT1, pctT2, pctT3, activeDays } = metrics;

  // 2) Tercios base (literales preservados)
  const thirds: ThirdPct[] = [
    { key: "T1", pct: pctT1 },
    { key: "T2", pct: pctT2 },
    { key: "T3", pct: pctT3 },
  ];

  // Ordenados por peso
  const sorted = [...thirds].sort((a, b) => b.pct - a.pct);
  const dominant = sorted[0];
  const second = sorted[1];

  // 3) Lenguaje según período
  const isCurrent = period === "current_month";

  const prefix = isCurrent ? "Hasta hoy," : `En ${monthLabel},`;
  const verb = isCurrent ? "se concentra" : "se concentró";

  // 4) Dominancia
  const DOMINANCE_THRESHOLD = 0.10;

  let headline: string;

  if (dominant.pct - second.pct >= DOMINANCE_THRESHOLD) {
    headline = isCurrent
      ? `${prefix} la mayor parte del gasto ${verb} en el ${labelForThird(
          dominant.key
        )}.`
      : `${prefix} gastaste principalmente ${timingLabel(
          dominant.key
        )}.`;
  } else {
    headline = isCurrent
        ? `${prefix} tu gasto ha estado bastante repartido a lo largo del mes.`
        : `${prefix} tu gasto estuvo bastante repartido en el tiempo.`;

  }

  // 5) Nota contextual (solo contexto)
  let note: string | undefined;

  if (activeDays === 1) {
    note = "Este análisis se basa en gastos registrados en un solo día.";
  } else if (activeDays <= 3) {
    note = "Este análisis se basa en pocos días con registro.";
  }

  return note ? { headline, note } : { headline };
}

// Helpers
function labelForThird(thirdKey: ThirdKey): string {
  switch (thirdKey) {
    case "T1":
      return "primer tercio";
    case "T2":
      return "segundo tercio";
    case "T3":
      return "tercer tercio";
  }
}

function timingLabel(thirdKey: ThirdKey): string {
  switch (thirdKey) {
    case "T1":
      return "al inicio del mes";
    case "T2":
      return "a mitad de mes";
    case "T3":
      return "hacia el final del mes";
  }
}
