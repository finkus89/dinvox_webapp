// webapp/lib/dinvox/date-utils.ts
// -------------------------------------------------------------
// Utilidades de fecha para el backend de Dinvox (API routes).
// Convierte rangos de fechas en formato local del usuario
// (YYYY-MM-DD en su timezone) → a rangos en UTC.
//
// Esto es CRÍTICO porque:
// - Los gastos en Supabase están guardados en UTC.
// - El usuario introduce/selecciona fechas en su hora local.
// - Sin esta conversión, perderías registros cercanos a medianoche
//   o se mezclarían días incorrectos.
// -------------------------------------------------------------

import { DateTime } from "luxon";

/**
 * Convierte un rango local (del usuario) a un rango UTC.
 *
 * @param fromLocalDate - fecha inicial (string "YYYY-MM-DD")
 * @param toLocalDate   - fecha final   (string "YYYY-MM-DD")
 * @param timezone      - ej: "America/Bogota", "Europe/Madrid"
 *
 * @returns Objeto con { fromUtc, toUtc } en formato ISO con Z
 *
 * Ejemplo:
 *   normalizeDateRangeToUTC("2025-12-01", "2025-12-07", "America/Bogota")
 *
 * Devuelve:
 *   {
 *     fromUtc: "2025-12-01T05:00:00.000Z",
 *     toUtc:   "2025-12-08T04:59:59.999Z"
 *   }
 *
 * NOTA:
 * - fromLocal se toma como 00:00:00 local.
 * - toLocal se toma como 23:59:59.999 local.
 * - Esto garantiza que incluimos TODO el día final.
 */
export function normalizeDateRangeToUTC(
  fromLocalDate: string,
  toLocalDate: string,
  timezone: string
) {
  // ------------------------------
  // 1. Construir inicio del día local (00:00:00)
  // ------------------------------
  const fromLocal = DateTime.fromISO(
    `${fromLocalDate}T00:00:00.000`,
    { zone: timezone }
  );

  // ------------------------------
  // 2. Construir fin del día local (23:59:59.999)
  // ------------------------------
  const toLocalEnd = DateTime.fromISO(
    `${toLocalDate}T23:59:59.999`,
    { zone: timezone }
  );

  // ------------------------------
  // 3. Convertir ambos instantes a UTC
  // ------------------------------
  const fromUtc = fromLocal.toUTC().toISO();
  const toUtc = toLocalEnd.toUTC().toISO();

  return {
    fromUtc,
    toUtc,
  };
}

/**
 * Normaliza una sola fecha a UTC a medianoche local.
 * Útil si quieres convertir un "solo día" a UTC.
 *
 * @param dateLocal - "YYYY-MM-DD"
 * @param timezone  - "America/Bogota"
 */
export function normalizeSingleDayToUTC(dateLocal: string, timezone: string) {
  const dateStartLocal = DateTime.fromISO(
    `${dateLocal}T00:00:00.000`,
    { zone: timezone }
  );

  return dateStartLocal.toUTC().toISO();
}
