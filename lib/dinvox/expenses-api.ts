// src/lib/dinvox/expenses-api.ts
// -----------------------------------------------------------------------------
// Helpers para consumir /api/expenses de forma consistente.
// - Construye URL con query params correctamente.
// - Maneja errores y parsing en un solo lugar.
// - Soporta AbortController (signal) desde las cards.
//
// Uso típico:
//   const data = await fetchExpenses<ApiExpenseAnalytics>(
//     { from, to, view: "analytics", transaction_type: "expense" },
//     { signal }
//   );
//
// Nota:
// - No incluye lógica de caching (aún).
// - No incluye hooks genéricos para evitar sobre-ingeniería.
// -----------------------------------------------------------------------------

import type { ExpensesQueryParams } from "@/lib/dinvox/expenses-api-types";

type FetchExpensesOptions = {
  signal?: AbortSignal;
};

function buildSearchParams(params: ExpensesQueryParams): URLSearchParams {
  const sp = new URLSearchParams();

  // requeridos
  sp.set("from", params.from);
  sp.set("to", params.to);

  // opcionales
  if (params.view) sp.set("view", params.view);
  if (params.transaction_type) sp.set("transaction_type", params.transaction_type);

  // filtros categoría(s)
  const categories = (params.categories ?? []).filter(Boolean);
  if (categories.length > 0) {
    sp.set("categories", categories.join(","));
  } else if (params.category && params.category !== "all") {
    sp.set("category", params.category);
  }

  return sp;
}

export function buildExpensesUrl(params: ExpensesQueryParams): string {
  const sp = buildSearchParams(params);
  return `/api/expenses?${sp.toString()}`;
}

export async function fetchExpenses<T>(
  params: ExpensesQueryParams,
  options: FetchExpensesOptions = {}
): Promise<T[]> {
  const url = buildExpensesUrl(params);

  const res = await fetch(url, {
    method: "GET",
    signal: options.signal,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg =
      payload?.error ??
      `Error al cargar gastos (${res.status} ${res.statusText}).`;
    throw new Error(msg);
  }

  const data = (await res.json()) as unknown;

  // Asegurar array para evitar crashes en cards
  return Array.isArray(data) ? (data as T[]) : [];
}