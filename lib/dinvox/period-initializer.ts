// webapp/lib/dinvox/period-initializer.ts
// ---------------------------------------
// Helper para inicializar PeriodState según parámetros iniciales (URL, etc.)

import type { PeriodFilterValue } from "@/components/filters/PeriodFilter";
import type { PeriodState } from "@/lib/dinvox/periods";
import { getPeriodDates } from "@/lib/dinvox/periods";

export function initPeriodState(
  initialPeriodType?: PeriodFilterValue,
  initialFrom?: string,
  initialTo?: string
): PeriodState {
  // 1) Si viene tipo de período desde la URL
  if (initialPeriodType) {
    if (initialPeriodType === "range") {
      // Si es range, usamos from/to si existen
      if (initialFrom && initialTo) {
        return {
          type: "range",
          from: initialFrom,
          to: initialTo,
        };
      }
      // Si no vienen, usamos mes actual pero dejando el tipo en "range"
      const { from, to } = getPeriodDates("month");
      return {
        type: "range",
        from,
        to,
      };
    }

    // Cualquier otro tipo soportado por PeriodFilterValue:
    // "today" | "week" | "7d" | "month" | "prev_month"
    const { from, to } = getPeriodDates(initialPeriodType);
    return {
      type: initialPeriodType,
      from,
      to,
    };
  }

  // 2) Si NO hay tipo pero sí from/to → asumimos rango
  if (initialFrom && initialTo) {
    return {
      type: "range",
      from: initialFrom,
      to: initialTo,
    };
  }

  // 3) Fallback: mes actual (como antes)
  const { from, to } = getPeriodDates("month");
  return {
    type: "month",
    from,
    to,
  };
}
