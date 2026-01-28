// src/lib/analytics/dates.ts
// -----------------------------------------------------------------------------
// Helpers de fechas y estado temporal para ANALYTICS / PERFORMANCE.
//
// Este módulo:
// - NO tiene dependencias de React ni de la UI
// - NO depende de filtros interactivos
// - Se usa para cálculos deterministas (tercios, presión, proyección)
//
// Se utiliza actualmente en:
// - MonthThirdsCard (Capa 1A – análisis por tercios)
// Y servirá después para:
// - mapa de presión del mes
// - proyección de cierre
// - insights temporales (ritmo, aceleración)
//
// Todas las funciones trabajan con fechas locales lógicas
// en formato "YYYY-MM-DD" (expense_date).
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// pad2
// -----------------------------------------------------------------------------
// Asegura que un número tenga 2 dígitos (ej: 3 → "03").
// Útil para construir fechas "YYYY-MM-DD".
export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

// -----------------------------------------------------------------------------
// getMonthStartYYYYMMDD
// -----------------------------------------------------------------------------
// Devuelve la fecha del PRIMER día del mes de la fecha dada.
// Entrada: Date (ej: hoy)
// Salida: string "YYYY-MM-DD" (ej: "2025-12-01")
export function getMonthStartYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1); // getMonth() es 0-based
  return `${year}-${month}-01`;
}

// -----------------------------------------------------------------------------
// getMonthEndYYYYMMDD
// -----------------------------------------------------------------------------
// Devuelve la fecha del ÚLTIMO día del mes de la fecha dada.
// Calcula el día real del mes (28, 30, 31 según corresponda).
//
// Entrada: Date (ej: hoy)
// Salida: string "YYYY-MM-DD" (ej: "2025-12-31")
export function getMonthEndYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const monthIndex = date.getMonth(); // 0..11
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();
  const month = pad2(monthIndex + 1);
  return `${year}-${month}-${pad2(lastDayOfMonth)}`;
}

// -----------------------------------------------------------------------------
// getTodayDay
// -----------------------------------------------------------------------------
// Devuelve el día del mes (1..31) de la fecha dada.
// Útil para determinar el estado del mes (en curso, tercio actual, etc.).
//
// Entrada: Date (ej: hoy)
// Salida: number (ej: 16)
export function getTodayDay(date: Date): number {
  return date.getDate();
}

// -----------------------------------------------------------------------------
// ThirdState
// -----------------------------------------------------------------------------
// Estado lógico de un tercio del mes según el día actual.
// - no_iniciado: aún no empieza
// - en_curso: está ocurriendo ahora
// - cerrado: ya terminó
export type ThirdState = "no_iniciado" | "en_curso" | "cerrado";

// -----------------------------------------------------------------------------
// getThirdStates
// -----------------------------------------------------------------------------
// Determina el estado de cada tercio del mes según el día actual.
//
// Reglas:
// - T1: días 1–10
// - T2: días 11–20
// - T3: días 21–fin
//
// Entrada: todayDay (number 1..31)
// Salida:
// {
//   t1: ThirdState,
//   t2: ThirdState,
//   t3: ThirdState
// }
//
// Nota:
// - El estado "cerrado" de T3 solo ocurrirá al finalizar el mes;
//   aquí se marca como "en_curso" cuando empieza.
export function getThirdStates(todayDay: number): {
  t1: ThirdState;
  t2: ThirdState;
  t3: ThirdState;
} {
  const t1: ThirdState = todayDay <= 10 ? "en_curso" : "cerrado";

  const t2: ThirdState =
    todayDay <= 10
      ? "no_iniciado"
      : todayDay <= 20
      ? "en_curso"
      : "cerrado";

  const t3: ThirdState = todayDay <= 20 ? "no_iniciado" : "en_curso";

  return { t1, t2, t3 };
}

// -----------------------------------------------------------------------------
// monthShortEs
// -----------------------------------------------------------------------------
// Devuelve el mes en español (3 letras) según una fecha.
// Entrada: Date
// Salida: "Ene" | "Feb" | ... | "Dic"
export function monthShortEs(date: Date): string {
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return months[date.getMonth()] ?? "";
}

// -----------------------------------------------------------------------------
// getMonthEndDay
// -----------------------------------------------------------------------------
// Extrae el día (DD) del string "YYYY-MM-DD".
// Entrada: "2025-12-31"
// Salida: "31"
export function getMonthEndDay(yyyyMmDd: string): string {
  return yyyyMmDd.slice(8, 10);
}

// -----------------------------------------------------------------------------
// getMonthLabelEs
// -----------------------------------------------------------------------------
// Devuelve label de mes para UI: "Dic 2025".
// Entrada: Date
// Salida: string
export function getMonthLabelEs(date: Date): string {
  return `${monthShortEs(date)} ${date.getFullYear()}`;
}

// -----------------------------------------------------------------------------
// getThirdRangesLabelEs
// -----------------------------------------------------------------------------
// Devuelve labels listos para UI con rangos del mes actual.
// - Usa el último día real del mes (28/29/30/31) a partir de "to".
// - Ej: T1 "01–10 Dic", T2 "11–20 Dic", T3 "21–31 Dic"
export function getThirdRangesLabelEs(now: Date, toYYYYMMDD: string): {
  t1: string;
  t2: string;
  t3: string;
} {
  const m = monthShortEs(now);
  const endDay = getMonthEndDay(toYYYYMMDD);

  return {
    t1: `01–10 ${m}`,
    t2: `11–20 ${m}`,
    t3: `21–${endDay} ${m}`,
  };
}



// -----------------------------------------------------------------------------
// Helpers adicionales de MES (MonthKey) para ANALYTICS
// -----------------------------------------------------------------------------
// Estos helpers NO cambian nada de lo existente.
// Se agregan para soportar cálculos como:
// - Ritmo del mes (acumulado diario + baseline con meses previos)
// - Evolución mensual (serie mes a mes)
// - Proyección (si se necesita navegar meses consistentemente)
//
// Todos trabajan con strings "YYYY-MM" y "YYYY-MM-DD" para evitar
// problemas de zona horaria.
//
// Se usarán en:
// - MonthRhythmCard (nuevo)
// - analytics/pace.ts (nuevo)
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// getMonthKeyFromYYYYMMDD
// -----------------------------------------------------------------------------
// Extrae el monthKey "YYYY-MM" desde una fecha "YYYY-MM-DD".
//
// Entrada: "2025-12-31"
// Salida: "2025-12"
//
// Uso principal:
// - Agrupar gastos por mes sin usar Date()
// - Ritmo del mes: construir series mensuales a partir de ExpenseForAnalytics[]
export function getMonthKeyFromYYYYMMDD(dateStr: string): string | null {
  if (!dateStr || dateStr.length < 7) return null;
  const mk = dateStr.slice(0, 7); // "YYYY-MM"
  if (!/^\d{4}-\d{2}$/.test(mk)) return null;
  return mk;
}

// -----------------------------------------------------------------------------
// getDayFromYYYYMMDD
// -----------------------------------------------------------------------------
// Extrae el día del mes (1..31) desde "YYYY-MM-DD".
//
// Entrada: "2025-12-03"
// Salida: 3
//
// Uso principal:
// - Ritmo del mes: crear acumulados diarios
export function getDayFromYYYYMMDD(dateStr: string): number | null {
  if (!dateStr || dateStr.length < 10) return null;
  const day = Number(dateStr.slice(8, 10));
  if (!Number.isFinite(day) || day < 1 || day > 31) return null;
  return day;
}

// -----------------------------------------------------------------------------
// getDaysInMonthFromMonthKey
// -----------------------------------------------------------------------------
// Devuelve cuántos días tiene un mes dado por "YYYY-MM".
//
// Entrada: "2025-02"
// Salida: 28  (o 29 en bisiesto)
//
// Uso principal:
// - Ritmo del mes: resolver el caso día 31 vs meses de 30 o febrero
// - Series diarias: dimensionar arrays dailyTotals/dailyCumulative
export function getDaysInMonthFromMonthKey(monthKey: string): number | null {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return null;

  const year = Number(monthKey.slice(0, 4));
  const month = Number(monthKey.slice(5, 7)); // 1..12

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }

  // new Date(year, month, 0) devuelve el último día del mes "month"
  // porque month es 1..12 aquí (JS Date usa 0..11, pero al pasar month
  // como 2, significa marzo; y día 0 = último día de febrero)
  return new Date(year, month, 0).getDate();
}

// -----------------------------------------------------------------------------
// getMonthStartFromMonthKey
// -----------------------------------------------------------------------------
// Devuelve "YYYY-MM-01" a partir de "YYYY-MM".
//
// Uso principal:
// - Construir rangos (from) para fetch a /api/expenses
export function getMonthStartFromMonthKey(monthKey: string): string | null {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return null;
  return `${monthKey}-01`;
}

// -----------------------------------------------------------------------------
// getMonthEndFromMonthKey
// -----------------------------------------------------------------------------
// Devuelve la fecha fin "YYYY-MM-DD" del mes real (28/29/30/31).
//
// Uso principal:
// - Construir rangos (to) para fetch a /api/expenses
export function getMonthEndFromMonthKey(monthKey: string): string | null {
  const days = getDaysInMonthFromMonthKey(monthKey);
  if (!days) return null;
  return `${monthKey}-${pad2(days)}`;
}

// -----------------------------------------------------------------------------
// shiftMonthKey
// -----------------------------------------------------------------------------
// Mueve un monthKey "YYYY-MM" N meses hacia adelante/atrás.
// deltaMonths puede ser negativo.
//
// Ej:
// shiftMonthKey("2026-01", -1) -> "2025-12"
// shiftMonthKey("2026-01", -3) -> "2025-10"
//
// Uso principal:
// - Ritmo del mes: obtener meses consecutivos previos (M-1, M-2, M-3)
// - Evolución mensual: recorrer meses sin depender de fechas de gastos
export function shiftMonthKey(monthKey: string, deltaMonths: number): string | null {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return null;

  const year = Number(monthKey.slice(0, 4));
  const month = Number(monthKey.slice(5, 7)); // 1..12

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }

  // Convertimos a índice 0-based total de meses
  const base = year * 12 + (month - 1);
  const next = base + Math.trunc(deltaMonths);

  if (!Number.isFinite(next)) return null;

  const nextYear = Math.floor(next / 12);
  const nextMonth0 = next % 12; // 0..11 (puede salir negativo si next < 0, pero en práctica no ocurrirá)
  const nextMonth = nextMonth0 + 1;

  return `${nextYear}-${pad2(nextMonth)}`;
}


// -----------------------------------------------------------------------------
// NUEVO: Helpers para series MENSUALES (Evolución mensual)
// -----------------------------------------------------------------------------
// Estos helpers complementan el soporte de "MonthKey" ("YYYY-MM") para poder:
//
// - Construir listas continuas de meses (para charts mes-a-mes)
// - Generar labels "Ene 2026" SIN depender de Date() en la UI
// - Preparar rangos tipo "últimos N meses" o "año en curso" de forma determinista
//
// IMPORTANTE:
// - Aquí SOLO hay lógica de fechas / llaves / etiquetas.
// - NO se agrupan gastos aquí (eso va en evolution.ts).
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// getMonthKeyFromDate
// -----------------------------------------------------------------------------
// Devuelve el monthKey "YYYY-MM" a partir de un Date (ej: hoy).
//
// Uso principal:
// - Evolución mensual: obtener el mes "anchor" (mes actual) en formato monthKey.
// - Ritmo del mes: también puede servir como util genérico.
export function getMonthKeyFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1); // 0-based -> 1..12
  return `${year}-${month}`;
}

// -----------------------------------------------------------------------------
// getMonthLabelEsFromMonthKey
// -----------------------------------------------------------------------------
// Devuelve un label "Ene 2026" a partir de un monthKey "YYYY-MM".
//
// Uso principal:
// - Evolución mensual: labels en el eje X sin recalcular con Date() en el chart.
export function getMonthLabelEsFromMonthKey(monthKey: string): string | null {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return null;

  const year = Number(monthKey.slice(0, 4));
  const month = Number(monthKey.slice(5, 7)); // 1..12
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }

  // Mismo set de abreviaturas que monthShortEs()
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const m = months[month - 1] ?? "";
  return `${m} ${year}`;
}

// -----------------------------------------------------------------------------
// getMonthKeysBetween
// -----------------------------------------------------------------------------
// Devuelve una lista CONTINUA de monthKeys entre start y end (inclusive),
// en orden ascendente.
//
// Ej:
// getMonthKeysBetween("2025-10","2026-01")
// -> ["2025-10","2025-11","2025-12","2026-01"]
//
// Uso principal:
// - Evolución mensual: rellenar meses faltantes con 0 y construir el eje X.
export function getMonthKeysBetween(startMonthKey: string, endMonthKey: string): string[] {
  if (!/^\d{4}-\d{2}$/.test(startMonthKey)) return [];
  if (!/^\d{4}-\d{2}$/.test(endMonthKey)) return [];

  // Convertimos a índice lineal para comparar (año*12 + mes0)
  const toIndex = (mk: string) => {
    const y = Number(mk.slice(0, 4));
    const m = Number(mk.slice(5, 7));
    return y * 12 + (m - 1);
  };

  const startIdx = toIndex(startMonthKey);
  const endIdx = toIndex(endMonthKey);

  if (!Number.isFinite(startIdx) || !Number.isFinite(endIdx)) return [];
  if (startIdx > endIdx) return [];

  const out: string[] = [];
  let current = startMonthKey;

  // Seguridad: máximo 240 meses (20 años) para evitar loops raros
  for (let i = 0; i < 240; i++) {
    out.push(current);
    if (current === endMonthKey) break;

    const next = shiftMonthKey(current, 1);
    if (!next) break;
    current = next;
  }

  // Si por cualquier razón no llegamos al end, devolvemos lo que se pudo construir
  return out;
}

// -----------------------------------------------------------------------------
// getLastNMonthKeys
// -----------------------------------------------------------------------------
// Devuelve los últimos N meses incluyendo el mes anchor, en orden ascendente.
// Ej:
// getLastNMonthKeys("2026-01", 3) -> ["2025-11","2025-12","2026-01"]
//
// Uso principal:
// - Evolución mensual: rangos de "últimos 3" y "últimos 6" meses.
export function getLastNMonthKeys(anchorMonthKey: string, n: number): string[] {
  if (!/^\d{4}-\d{2}$/.test(anchorMonthKey)) return [];
  const N = Math.trunc(n);
  if (!Number.isFinite(N) || N <= 0) return [];

  const start = shiftMonthKey(anchorMonthKey, -(N - 1));
  if (!start) return [anchorMonthKey];

  return getMonthKeysBetween(start, anchorMonthKey);
}

// -----------------------------------------------------------------------------
// getYearToDateMonthKeys
// -----------------------------------------------------------------------------
// Devuelve los monthKeys desde Enero del año del anchor hasta el anchor (inclusive).
// Ej:
// getYearToDateMonthKeys("2026-01") -> ["2026-01"]
// getYearToDateMonthKeys("2026-07") -> ["2026-01","2026-02",...,"2026-07"]
//
// Uso principal:
// - Evolución mensual: rango "año en curso" (YTD).
export function getYearToDateMonthKeys(anchorMonthKey: string): string[] {
  if (!/^\d{4}-\d{2}$/.test(anchorMonthKey)) return [];
  const year = anchorMonthKey.slice(0, 4);
  const start = `${year}-01`;
  return getMonthKeysBetween(start, anchorMonthKey);
}
