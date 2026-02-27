// src/lib/analytics/insights/monthPace.ts
// -----------------------------------------------------------------------------
// Insight builder: Ritmo del mes (Month Pace)
//
// Reglas:
// - NO repite acumulado, día, R ni confianza.
// - Devuelve headline + deltaPct + baselineMonthsUsedCount.
// - UI decide cómo mostrar el % y el texto comparativo.
// -----------------------------------------------------------------------------

import type {
  MonthPaceResult,
  PaceStatus,
  PaceConfidence,
} from "@/lib/analytics/pace";
import type { AnalysisPeriodValue } from "@/components/filters/PeriodFilter";

export type InsightSeverity = "good" | "info" | "warn";

export type MonthPaceInsightStatus =
  | "no_calculable"
  | "sin_referencia"
  | "contenido"
  | "normal"
  | "acelerado";

export type MonthPaceInsight = {
  key: "month_pace";
  status: MonthPaceInsightStatus;

  headline: string;
  note?: string;

  severity: InsightSeverity;
  deltaPct: number | null;
  confidence: PaceConfidence;
  baselineMonthsUsedCount: number;
};

function statusToLabel(s: PaceStatus) {
  if (s === "acelerado") return "acelerado";
  if (s === "contenido") return "contenido";
  return "normal";
}

function severityFromStatus(status: MonthPaceInsightStatus): InsightSeverity {
  if (status === "acelerado") return "warn";
  if (status === "contenido") return "good";
  return "info";
}

export function buildMonthPaceInsight(args: {
  pace: MonthPaceResult | null;
  period: Extract<AnalysisPeriodValue, "current_month" | "previous_month">;
  monthLabel: string;
}): MonthPaceInsight {
  const { pace, period, monthLabel } = args;

  // 1️⃣ No calculable
  if (!pace) {
    return {
      key: "month_pace",
      status: "no_calculable",
      headline: "No se pudo interpretar el ritmo del mes.",
      note: `Revisa que exista data suficiente para ${monthLabel}.`,
      severity: "info",
      deltaPct: null,
      confidence: "sin_referencia",
      baselineMonthsUsedCount: 0,
    };
  }

  const baselineCount = pace.baselineMonthsUsed.length;

  // 2️⃣ Sin referencia suficiente
  if (pace.status == null || pace.deltaPct == null || pace.R == null) {
    return {
      key: "month_pace",
      status: "sin_referencia",
      headline:
        period === "previous_month"
          ? `En ${monthLabel} no hubo referencia suficiente para evaluar tu comportamiento.`
          : "Este mes aún no hay referencia suficiente para evaluar tu comportamiento.",
      note:
        "Cuando tengas más meses registrados, podrás ver si tu gasto va contenido, normal o acelerado.",
      severity: "info",
      deltaPct: null,
      confidence: pace.confidence,
      baselineMonthsUsedCount: baselineCount,
    };
  }

  // 3️⃣ Con referencia válida
  const label = statusToLabel(pace.status);

  const headline =
    period === "previous_month"
      ? `En ${monthLabel} tu gasto fue ${label}.`
      : `Este mes tu gasto está siendo ${label}.`;

  return {
    key: "month_pace",
    status: pace.status,
    headline,
    severity: severityFromStatus(pace.status),
    deltaPct: pace.deltaPct,
    confidence: pace.confidence,
    baselineMonthsUsedCount: baselineCount,
  };
}