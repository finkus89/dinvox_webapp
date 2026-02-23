// src/lib/dinvox/expenses-api-types.ts
// -----------------------------------------------------------------------------
// Tipos compartidos para consumir /api/expenses.
//
// Objetivo:
// - Evitar drift entre cards (Tercios/Ritmo/Evolution/Tabla).
// - Centralizar:
//    • view ("full" | "analytics")
//    • transaction_type ("expense" | "income")
//    • shapes de respuesta para cada view
//
// Nota:
// - /api/expenses por defecto devuelve view="full".
// - view="analytics" devuelve payload liviano (sin note/id).
// -----------------------------------------------------------------------------

export type TransactionType = "expense" | "income";
export type ExpensesView = "full" | "analytics";

// -----------------------
// Response shapes
// -----------------------

// Respuesta estándar (default): view="full"
export type ApiExpenseFull = {
  id: string;
  date: string; // "YYYY-MM-DD"
  categoryId: string;
  amount: number;
  currency: string;
  note: string;
};

// Respuesta liviana: view="analytics"
export type ApiExpenseAnalytics = {
  date: string; // "YYYY-MM-DD"
  categoryId: string;
  amount: number;
  currency: string;
};

// -----------------------
// Request params (client-side)
// -----------------------

export type ExpensesQueryParams = {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD

  // 🆕 para mantener consistencia: preferimos enviarlo siempre,
  // aunque en server el default sea "expense".
  transaction_type?: TransactionType;

  // view default: "full"
  view?: ExpensesView;

  // filtros de categoría (misma prioridad que server):
  // - categories (multi) tiene prioridad si se envía con valores.
  // - category (single) se usa si categories está vacío.
  category?: string; // "comida" | "all" | ...
  categories?: string[]; // ["ocio","comida"]
};