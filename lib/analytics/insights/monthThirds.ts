// src/lib/analytics/insights/monthThirds.ts
// -----------------------------------------------------------------------------
// Builder de insight para la card "Tercios del mes".
//
// Reglas (v2):
// 1) No data
// 2) Datos insuficientes (activeDays < 3) -> headline neutro + nota fuerte
// 3) Bimodal (dos picos: dos tercios altos y uno bajo)
// 4) Concentrado (dominancia clara)
// 5) Repartido (distribución pareja)
// 6) Caso gris (mayor peso leve, sin concentración marcada)
//
// Umbrales (confirmados):
// - Repartido: spread <= 12 pts
// - Concentrado: spread >= 22 pts
// - Dominancia: top - second >= 10 pts
// - Bimodal: spread >= 22 pts + (top2 cercanos <= 8 pts) + ambos > low + 10 pts
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
  pct: number; // 0..1
};

function pctToPts(p: number) {
  // convertimos 0..1 a 0..100 para operar con umbrales en "puntos porcentuales"
  return Math.round(p * 100);
}

export function buildMonthThirdsInsight(args: {
  metrics: MonthThirdsMetrics | null;
  period: Period;
  monthLabel: string;
}): MonthThirdsInsight {
  const { metrics, period, monthLabel } = args;

  // 1) No data
  if (!metrics || metrics.totalMonth <= 0) {
    return { headline: "No hay gastos registrados en este período." };
  }

  const { pctT1, pctT2, pctT3, activeDays } = metrics;

  const thirds: ThirdPct[] = [
    { key: "T1", pct: pctT1 },
    { key: "T2", pct: pctT2 },
    { key: "T3", pct: pctT3 },
  ];

  // Ordenados por peso
  const sorted = [...thirds].sort((a, b) => b.pct - a.pct);
  const top = sorted[0];
  const mid = sorted[1];
  const low = sorted[2];

  // Lenguaje según período (mantener semántica)
  const isCurrent = period === "current_month";
  const prefix = isCurrent ? "Hasta hoy," : `En ${monthLabel},`;
  const verb = isCurrent ? "se concentra" : "se concentró";

  // Umbrales en puntos (0..100)
  const REPARTIDO_SPREAD_MAX = 12; // <= 12 pts
  const CONCENTRADO_SPREAD_MIN = 22; // >= 22 pts
  const DOMINANCE_THRESHOLD = 10; // >= 10 pts
  const BIMODAL_TOP2_MAX_DIFF = 8; // <= 8 pts
  const BIMODAL_ABOVE_LOW_MIN_DIFF = 10; // cada top debe estar >= 10 pts sobre low

  const topPts = pctToPts(top.pct);
  const midPts = pctToPts(mid.pct);
  const lowPts = pctToPts(low.pct);

  const spreadPts = topPts - lowPts;
  const dominancePts = topPts - midPts;
  const top2DiffPts = topPts - midPts;

  // 2) Datos insuficientes (primero, antes de clasificar)
  // - No bloquea el insight, pero baja la “confianza” con una nota fuerte.
  // - Headline neutro para no sobreafirmar.
  if (activeDays < 3) {
    const headline = isCurrent
      ? "Hasta hoy, aún hay muy pocos días con registro para detectar un patrón claro."
      : `${prefix} hubo muy pocos días con registro para detectar un patrón claro.`;

    const note =
      activeDays === 1
        ? "Este análisis se basa en gastos registrados en un solo día."
        : "Este análisis se basa en muy pocos días con registro.";

    return { headline, note };
  }

  // 3) Bimodal (más específico que “concentrado”)
  // - spread alto
  // - dos mayores cercanos
  // - ambos mayores claramente por encima del menor
  const isBimodal =
    spreadPts >= CONCENTRADO_SPREAD_MIN &&
    top2DiffPts <= BIMODAL_TOP2_MAX_DIFF &&
    topPts - lowPts >= BIMODAL_ABOVE_LOW_MIN_DIFF &&
    midPts - lowPts >= BIMODAL_ABOVE_LOW_MIN_DIFF;

  if (isBimodal) {
    // low determina “qué parte” fue la más baja => los otros dos son los picos.
    const headline = isCurrent
      ? `${prefix} tu gasto ${verb} en dos momentos del mes: ${bimodalLabel(low.key, true)}.`
      : `${prefix} tu gasto ${verb} en dos momentos del mes: ${bimodalLabel(low.key, false)}.`;

    return { headline };
  }

  // 4) Concentrado por dominancia clara
  // (y normalmente también tendrá spread alto, pero aquí priorizamos la señal “clara”)
  if (dominancePts >= DOMINANCE_THRESHOLD) {
    const headline = isCurrent
      ? `${prefix} la mayor parte del gasto ${verb} en el ${labelForThird(top.key)}.`
      : `${prefix} gastaste principalmente ${timingLabel(top.key)}.`;

    return { headline };
  }

  // 5) Repartido (spread bajo)
  if (spreadPts <= REPARTIDO_SPREAD_MAX) {
    const headline = isCurrent
      ? `${prefix} tu gasto ha estado bastante repartido a lo largo del mes.`
      : `${prefix} tu gasto estuvo bastante repartido en el tiempo.`;

    return { headline };
  }

  // 6) Caso gris (sin dominancia fuerte, sin ser repartido, sin ser bimodal)
  // Mensaje descriptivo, sin sobreafirmar.
  const headline = isCurrent
    ? `${prefix} tu gasto tiene algo más de peso en el ${labelForThird(top.key)}, aunque sin una concentración marcada.`
    : `${prefix} tu gasto tuvo algo más de peso ${timingLabel(top.key)}, aunque sin una concentración marcada.`;

  return { headline };
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

/**
 * Describe los “dos picos” según cuál tercio fue el menor:
 * - Si el menor es T2 => picos: inicio + final
 * - Si el menor es T1 => picos: mitad + final
 * - Si el menor es T3 => picos: inicio + mitad
 *
 * El boolean isCurrent solo ajusta el wording mínimo.
 */
function bimodalLabel(lowThird: ThirdKey, isCurrent: boolean): string {
  switch (lowThird) {
    case "T2":
      return isCurrent ? "inicio y final" : "al inicio y hacia el final";
    case "T1":
      return isCurrent ? "mitad y final" : "a mitad y hacia el final";
    case "T3":
      return isCurrent ? "inicio y mitad" : "al inicio y a mitad";
  }
}