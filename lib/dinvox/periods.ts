// webapp/lib/dinvox/periods.ts
// -------------------------------------------
// Helpers de período y fechas para la UI
// (dashboard, tabla de gastos, etc.)
// -------------------------------------------

import type { PeriodFilterValue } from "@/components/filters/PeriodFilter";

// Estado unificado de período para la UI
// - type: today, week, 7d, month, prev_month, range
// - from/to: "YYYY-MM-DD"
export type PeriodState = {
  type: PeriodFilterValue;
  from: string;
  to: string;
};

// Helper: formatea un Date a "YYYY-MM-DD"
export function formatDateISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Helper: formatea "YYYY-MM-DD" a algo legible para el usuario ("01 nov 2025")
export function formatDateHuman(isoDate: string): string {
  if (!isoDate) return "-";

  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;

  const [year, month, day] = parts;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  if (Number.isNaN(date.getTime())) return isoDate;

  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Helper: calcula from/to según el tipo de período
// Nota: semana actual (lunes–domingo), mes actual y mes anterior
export function getPeriodDates(
  type: PeriodFilterValue
): { from: string; to: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const clampToToday = (date: Date) => {
    return date > today ? new Date(today) : date;
  };

  if (type === "today") {
    const from = formatDateISO(today);
    const to = formatDateISO(today);
    return { from, to };
  }

  if (type === "7d") {
    const toDate = new Date(today);
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - 6);
    return {
      from: formatDateISO(fromDate),
      to: formatDateISO(clampToToday(toDate)),
    };
  }

  if (type === "week") {
    const day = today.getDay(); // 0 = domingo, 1 = lunes, ...
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const toDate = clampToToday(sunday);

    return {
      from: formatDateISO(monday),
      to: formatDateISO(toDate),
    };
  }

  if (type === "month") {
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const toDate = clampToToday(lastDay);

    return {
      from: formatDateISO(firstDay),
      to: formatDateISO(toDate),
    };
  }

  if (type === "prev_month") {
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstPrev = new Date(year, month - 1, 1);
    const lastPrev = new Date(year, month, 0);

    return {
      from: formatDateISO(firstPrev),
      to: formatDateISO(lastPrev),
    };
  }

  return { from: "", to: "" };
}

// Helper: formatea "YYYY-MM-DD" como "YYYY/MM/DD" (compacto, ideal para tablas)
export function formatDateShort(isoDate: string): string {
  if (!isoDate) return "-";

  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;

  const [year, month, day] = parts;
  return `${year}/${month}/${day}`;
}
