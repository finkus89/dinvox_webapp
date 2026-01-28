// ------------------------------------------------------------
// Análisis por tercios del mes
// T1: días 1–10
// T2: días 11–20
// T3: días 21–fin
//
// Este módulo:
// - NO hace fetch
// - NO conoce UI
// - NO conoce Supabase
// - SOLO recibe gastos y calcula métricas
//
// Es reutilizable, testeable y fácil de mover a backend si algún día hace falta
// ------------------------------------------------------------


// =======================
// Tipos de entrada
// =======================

// Gasto mínimo necesario para análisis.
// Usamos `date` como "YYYY-MM-DD" (expense_date local)
// y `amount` como número positivo.
export type ExpenseForAnalytics = {
  date: string;   // "YYYY-MM-DD"
  amount: number; // entero (COP)
};


// =======================
// Tipos de salida
// =======================

// Resultado del análisis por tercios del mes.
// Todo lo que devuelve este objeto es "data cruda",
// todavía NO hay insights ni frases.
export type MonthThirdsMetrics = {
  // Mes analizado en formato "YYYY-MM"
  monthKey: string;
  // Cantidad total de gastos registrados en el mes
  nExpenses: number;
  // Cantidad de días distintos con al menos un gasto
  activeDays: number;
  // Primer día del mes en el que el usuario registró algo
  // (ej: 3, 15, 27). Null si no hay datos válidos.
  firstDayWithExpense: number | null;
  // Totales por tercio
  totalMonth: number;
  totalT1: number; // días 1–10
  totalT2: number; // días 11–20
  totalT3: number; // días 21–fin
  // Porcentaje del total mensual por tercio (0..1)
  pctT1: number;
  pctT2: number;
  pctT3: number;
};


// =======================
// Helpers internos
// =======================

// Extrae el día del mes desde "YYYY-MM-DD"
// Evitamos usar new Date() para no tener problemas de zona horaria.
function getDayFromDate(dateStr: string): number | null {
  if (!dateStr || dateStr.length < 10) return null;

  // Toma los caracteres del día (posición 8 y 9)
  const day = Number(dateStr.slice(8, 10));

  // Validación básica
  if (!Number.isFinite(day) || day < 1 || day > 31) return null;

  return day;
}


// Extrae el mes en formato "YYYY-MM" desde la fecha.
// Se usa solo para mostrar/identificar el mes analizado.
function getMonthKey(dateStr: string): string | null {
  if (!dateStr || dateStr.length < 7) return null;

  const mk = dateStr.slice(0, 7); // "YYYY-MM"

  // Validación mínima
  if (!/^\d{4}-\d{2}$/.test(mk)) return null;

  return mk;
}


// =======================
// Función principal
// =======================

// Calcula los totales y porcentajes por tercio del mes.
//
// IMPORTANTE:
// - Se asume que `expenses` YA vienen filtrados por el mes actual
//   (eso lo hace la API con from/to).
// - Si no hay gastos, devuelve null.
export function computeMonthThirds(
  expenses: ExpenseForAnalytics[]
): MonthThirdsMetrics | null {

  // Si no hay gastos, no hay nada que analizar
  if (!expenses || expenses.length === 0) return null;

  // Inferimos el mes a partir del primer gasto.
  // (Todos deberían ser del mismo mes si la API filtró bien.)
  const inferredMonthKey =
    getMonthKey(expenses[0].date) ?? "unknown";

  // Acumuladores por tercio
  let totalT1 = 0;
  let totalT2 = 0;
  let totalT3 = 0;

  // Set para contar días únicos con gastos
  const daySet = new Set<string>();

  // Para detectar el primer día en que el usuario registró algo
  let firstDay: number | null = null;

  // Recorremos todos los gastos del mes
  for (const e of expenses) {
    const day = getDayFromDate(e.date);
    if (day == null) continue;

    // Guardamos el día completo (YYYY-MM-DD) para contar días únicos
    daySet.add(e.date);

    // Detectamos el primer día con gasto
    if (firstDay == null || day < firstDay) {
      firstDay = day;
    }

    // Validación del monto
    const amt = Number(e.amount);
    if (!Number.isFinite(amt) || amt <= 0) continue;

    // Clasificación por tercio
    if (day <= 10) {
      totalT1 += amt;
    } else if (day <= 20) {
      totalT2 += amt;
    } else {
      totalT3 += amt;
    }
  }

  // Total del mes (solo lo registrado)
  const totalMonth = totalT1 + totalT2 + totalT3;

  // Porcentajes por tercio (evitamos división por cero)
  const pctT1 = totalMonth > 0 ? totalT1 / totalMonth : 0;
  const pctT2 = totalMonth > 0 ? totalT2 / totalMonth : 0;
  const pctT3 = totalMonth > 0 ? totalT3 / totalMonth : 0;

  // Resultado final
  return {
    monthKey: inferredMonthKey,

    nExpenses: expenses.length,
    activeDays: daySet.size,
    firstDayWithExpense: firstDay,

    totalMonth,
    totalT1,
    totalT2,
    totalT3,

    pctT1,
    pctT2,
    pctT3,
  };
}
