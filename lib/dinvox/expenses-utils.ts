// webapp/lib/dinvox/expenses-utils.ts
// ------------------------------------
// Helpers comunes para gastos (tabla, CSV, formatos)

import { CATEGORIES } from "@/lib/dinvox/categories";
import type { CategoryId } from "@/lib/dinvox/categories";

// Shape estándar de un gasto usado en la UI
export type ApiExpense = {
  id: string;
  date: string; // "YYYY-MM-DD" (expense_date local)
  categoryId: CategoryId;
  amount: number;
  currency: string;
  note: string;
};

// Formato de monto visual con moneda, ej: "$150.000 COP"
export function formatAmount(value: number, currency: string): string {
  const formatted = new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(value);

  return `$${formatted} ${currency}`;
}

// Formato sin moneda, ej: "150.000"
export function formatAmountNoCurrency(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(value);
}

// Exportar a CSV (usando los gastos ya cargados en la UI)
export function exportExpensesToCSV(expenses: ApiExpense[], currency: string) {
  if (!expenses.length) {
    alert("No hay gastos para exportar en este rango.");
    return;
  }

  // Encabezados del CSV
  const headers = ["Fecha", "Categoría", `Monto (${currency})`, "Nota"];

  // Filas
  const rows = expenses.map((exp) => {
    const categoryCfg = CATEGORIES[exp.categoryId];
    const categoryLabel = categoryCfg ? categoryCfg.label : exp.categoryId;

    // Escapar comillas en la nota
    const safeNote = (exp.note ?? "").replace(/"/g, '""');

    return [
      exp.date, // ya viene "YYYY-MM-DD"
      categoryLabel, // nombre legible de la categoría
      String(exp.amount), // sin formato, para que Excel lo lea como número
      `"${safeNote}"`, // nota entre comillas
    ].join(",");
  });

  // BOM para que Excel abra bien UTF-8
  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const today = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `dinvox-gastos-${today}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
