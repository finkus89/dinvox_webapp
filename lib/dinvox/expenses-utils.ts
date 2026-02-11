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

// Monedas sin decimales comunes
function usesZeroDecimals(currency: string) {
  return ["COP", "CLP", "JPY"].includes((currency ?? "COP").toUpperCase());
}

// ✅ Helper centralizado para formatear dinero correctamente según currency + language
export function formatMoney(
  value: number,
  currency: string,
  language?: string
): string {
  const cur = (currency ?? "COP").toUpperCase();
  const zeroDecimals = usesZeroDecimals(cur);
  const locale = language ?? "es-CO";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: cur,
    minimumFractionDigits: zeroDecimals ? 0 : 2,
    maximumFractionDigits: zeroDecimals ? 0 : 2,
  }).format(Number(value) || 0);
}

// 🔄 Reemplazamos el viejo formatAmount (compat)
export function formatAmount(
  value: number,
  currency: string,
  language?: string
): string {
  return formatMoney(value, currency, language);
}

// 🔄 Formato sin moneda (pero respetando locale real del usuario)
export function formatAmountNoCurrency(
  value: number,
  currency: string,
  language?: string
): string {
  const cur = (currency ?? "COP").toUpperCase();
  const zeroDecimals = usesZeroDecimals(cur);
  const locale = language ?? "es-CO";

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: zeroDecimals ? 0 : 2,
    maximumFractionDigits: zeroDecimals ? 0 : 2,
  }).format(Number(value) || 0);
}

// Exportar a CSV (usando los gastos ya cargados en la UI)
export function exportExpensesToCSV(expenses: ApiExpense[], currency: string) {
  if (!expenses.length) {
    alert("No hay gastos para exportar en este rango.");
    return;
  }

  const cur = (currency ?? "COP").toUpperCase();
  const headers = ["Fecha", "Categoría", `Monto (${cur})`, "Nota"];

  const rows = expenses.map((exp) => {
    const categoryCfg = CATEGORIES[exp.categoryId];
    const categoryLabel = categoryCfg ? categoryCfg.label : exp.categoryId;

    const safeNote = (exp.note ?? "").replace(/"/g, '""');

    return [
      exp.date,
      categoryLabel,
      String(exp.amount), // sin formato para que Excel lo lea como número real
      `"${safeNote}"`,
    ].join(",");
  });

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
