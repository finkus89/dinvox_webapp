/**
 * Dinvox — Performance Bundle (DATA-ONLY)
 * --------------------------------------
 * Ubicación:
 *   src/lib/analytics/bundle/getPerformanceBundle.ts
 *
 * Qué hace:
 *   - Trae datos agregados de performance desde Supabase usando RPCs.
 *   - NO calcula ritmo/tercios/evolución.
 *   - NO genera insights/texto.
 *
 * Por qué existe:
 *   - Queremos que UI y Canal usen la misma “fuente” de datos agregados,
 *     sin bajar transacciones crudas.
 *
 * Importante:
 *   - El cliente Supabase se INYECTA como parámetro.
 *     Esto permite dos usos:
 *       A) UI (session client)  -> respeta auth.uid() y RLS.
 *       B) Canal (service role) -> server-to-server (n8n) con key.
 *
 * Inputs:
 *   - Este módulo NO calcula rangos/fechas. El endpoint debe pasar:
 *     from/to para summary, daily y monthly.
 *
 * RPCs que llama:
 *   1) get_range_summary            -> resumen del mes (total + categorías) para rango dado
 *   2) get_daily_totals             -> total por día
 *   3) get_monthly_category_totals  -> total por mes y categoría
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

type TransactionType = "expense" | "income";

/**
 * Contrato de salida del bundle (data-only).
 * Nota: Se devuelven strings ya normalizadas del lado de Supabase:
 * - ymd: 'YYYY-MM-DD'
 * - monthKey: 'YYYY-MM'
 */
export type PerformanceBundleData = {
  summaryCurrent: {
    total: number;
    count: number;
    byCategory: { categoryId: string; amount: number; percent: number }[];
    from: string;
    to: string;
  };

  dailyTotals: {
    ymd: string;     // YYYY-MM-DD
    total: number;   // total_amount del día
    txCount: number; // cantidad de transacciones del día
  }[];

  monthlyCategoryTotals: {
    monthKey: string;  // YYYY-MM
    categoryId: string;
    total: number;
    txCount: number;
  }[];
};

/**
 * Inputs del bundle.
 * - authUserId: el auth_user_id del usuario dueño de los gastos
 * - rangos: se pasan como strings YYYY-MM-DD ya resueltos por el endpoint
 */
export type GetPerformanceBundleOpts = {
  authUserId: string;

  fromDaily: string;
  toDaily: string;

  fromMonthly: string;
  toMonthly: string;

  fromSummary: string;
  toSummary: string;

  transactionType?: TransactionType; // default: 'expense'
};

/**
 * Helper mínimo: convierte valores sueltos a número seguro.
 * Se usa porque Postgres/Supabase a veces devuelve numeric como string.
 */
function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Helper mínimo: fuerza el transaction type a valores válidos.
 * Por ahora Dinvox usa expense; income se prepara pero puede activarse después.
 */
function normalizeTransactionType(v?: string): TransactionType {
  return v === "income" ? "income" : "expense";
}

/**
 * getPerformanceBundleData
 * -----------------------
 * Función central del bundle.
 *
 * - NO crea cliente Supabase: lo recibe inyectado.
 * - Llama RPCs en paralelo.
 * - Normaliza el shape a PerformanceBundleData.
 */
export async function getPerformanceBundleData(
  supabase: SupabaseClient,
  opts: GetPerformanceBundleOpts
): Promise<PerformanceBundleData> {
  const transactionType = normalizeTransactionType(opts.transactionType);

  // Llamamos RPCs en paralelo para reducir latencia total.
  const [summaryRes, dailyRes, monthlyRes] = await Promise.all([
    // 1) Resumen agregado por rango (para "mes a hoy", o el rango que decidas)
    supabase.rpc("get_range_summary", {
      p_auth_user_id: opts.authUserId,
      p_from: opts.fromSummary,
      p_to: opts.toSummary,
      p_transaction_type: transactionType,
    }),

    // 2) Totales por día (para Ritmo y Tercios)
    supabase.rpc("get_daily_totals", {
      p_auth_user_id: opts.authUserId,
      p_from: opts.fromDaily,
      p_to: opts.toDaily,
      p_transaction_type: transactionType,
    }),

    // 3) Totales por mes y categoría (para Evolución y futuros insights)
    supabase.rpc("get_monthly_category_totals", {
      p_auth_user_id: opts.authUserId,
      p_from: opts.fromMonthly,
      p_to: opts.toMonthly,
      p_transaction_type: transactionType,
    }),
  ]);

  // Si alguna RPC falla, mejor fallar rápido (endpoint retornará 500 y log).
  if (summaryRes.error) throw summaryRes.error;
  if (dailyRes.error) throw dailyRes.error;
  if (monthlyRes.error) throw monthlyRes.error;

  /**
   * get_range_summary:
   * Dependiendo de cómo esté definida la RPC, Supabase puede devolver:
   * - un objeto { total_amount, count, by_category } o
   * - un array [{...}]
   *
   * Soportamos ambas sin inventar más.
   */
  const summaryRow =
    Array.isArray(summaryRes.data) ? (summaryRes.data[0] ?? null) : (summaryRes.data ?? null);

  const total = toNum((summaryRow as any)?.total_amount);
  const count = toNum((summaryRow as any)?.count);

  // by_category esperado: [{ category_id, amount }]
  const rawByCat = Array.isArray((summaryRow as any)?.by_category)
    ? ((summaryRow as any).by_category as any[])
    : [];

  /**
   * Calculamos percent aquí porque:
   * - el resumen trae amount por categoría pero no siempre trae percent
   * - esto NO es “analytics”, es solo una normalización para UI/canal.
   */
  const byCategory = rawByCat
    .map((r) => {
      const categoryId = String(r.category_id ?? "");
      const amount = toNum(r.amount);
      return {
        categoryId,
        amount,
        percent: total > 0 ? (amount / total) * 100 : 0,
      };
    })
    // Si llegara una categoría vacía por error, la filtramos para no romper UI
    .filter((r) => r.categoryId)
    .sort((a, b) => b.amount - a.amount);

  /**
   * dailyTotals:
   * RPC get_daily_totals devuelve: ymd, total_amount, tx_count
   */
  const dailyTotals = (Array.isArray(dailyRes.data) ? dailyRes.data : []).map((r: any) => ({
    ymd: String(r.ymd),               // 'YYYY-MM-DD'
    total: toNum(r.total_amount),     // numeric -> number
    txCount: toNum(r.tx_count),
  }));

  /**
   * monthlyCategoryTotals:
   * RPC get_monthly_category_totals devuelve:
   * - month_key 'YYYY-MM'
   * - category_id
   * - total_amount
   * - tx_count
   */
  const monthlyCategoryTotals = (Array.isArray(monthlyRes.data) ? monthlyRes.data : []).map(
    (r: any) => ({
      monthKey: String(r.month_key),     // 'YYYY-MM'
      categoryId: String(r.category_id),
      total: toNum(r.total_amount),
      txCount: toNum(r.tx_count),
    })
  );

  // Retorno final (solo datos).
  return {
    summaryCurrent: {
      total,
      count,
      byCategory,
      from: opts.fromSummary,
      to: opts.toSummary,
    },
    dailyTotals,
    monthlyCategoryTotals,
  };
}