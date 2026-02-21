// src/lib/dinvox/insights/month-summary.ts
// -----------------------------------------------------------------------------
// Motor v1: Insight del mes (Summary-only)
//
// INPUT (summary)
// - total: number
// - categories[]: { categoryId, amount, percent } (ordenadas desc por amount)
// - meta: { count, from, to, timezone }
//
// INPUT (context)
// - currency (ISO): "COP" | "EUR" | ...
// - language: "es-CO" | ...
// - timezone: "America/Bogota" | ...
//
// OUTPUT
// {
//   kind: "no_data" | "summary",
//   confidence: "low" | "medium" | "high",
//   message: string
// }
//
// REGLAS
// - Siempre responde algo.
// - count=0: mensaje neutro (“este mes no hay gastos”).
// - count>0: total a hoy + top categorías (con emojis).
// - top3% solo si categories.length >= 5.
// - Confidence por count: 1=low, 2-4=medium, >=5=high.
// -----------------------------------------------------------------------------
//
// REUSO DE HELPERS EXISTENTES
// - CATEGORIES (emoji/label): ✅ reuse
// - monthShortEs + pad2: ✅ reuse para "A hoy 21 Feb"
// - formatMoney(): NO se usa aquí porque puede mostrar "COP"/"US$" según locale.
//   Para botón queremos símbolo-only -> usamos Intl con currencyDisplay:narrowSymbol.
//
// Si luego quieres centralizarlo, lo mejor es agregar un helper nuevo en
// expenses-utils (ej: formatMoneySymbol) y reemplazar esta función local.
// -----------------------------------------------------------------------------

import { CATEGORIES } from "@/lib/dinvox/categories";
import { monthShortEs, pad2 } from "@/lib/analytics/dates";

type SummaryCategory = {
  categoryId: string;
  amount: number;
  percent: number; // 0–100
};

type MonthSummary = {
  total: number;
  categories: SummaryCategory[];
  meta: { count: number; from: string; to: string; timezone: string };
};

type BuildArgs = {
  summary: MonthSummary;
  currency: string; // "COP", "EUR", ...
  language: string; // "es-CO", ...
  timezone: string; // (no usado en v1 aquí; viene para consistencia futura)
};

function confidenceFromCount(count: number): "low" | "medium" | "high" {
  if (count <= 1) return "low";
  if (count <= 4) return "medium";
  return "high";
}

function pctShort(p: number) {
  // 1 decimal y sin ".0"
  const v = Math.round(p * 10) / 10;
  return Number.isInteger(v) ? `${v.toFixed(0)}%` : `${v.toFixed(1)}%`;
}

/**
 * Formato de dinero "símbolo solamente".
 * - Ej: "$ 120.000" en es-CO para COP, "€120.00" para EUR.
 * - Usamos narrowSymbol para evitar "COP" / "USD".
 */
function formatMoneySymbolOnly(
  value: number,
  currency: string,
  language: string
): string {
  const cur = (currency ?? "COP").toUpperCase();
  const locale = language ?? "es-CO";
  const zeroDecimals = ["COP", "CLP", "JPY"].includes(cur);
  const amount = Number(value) || 0;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: cur,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: zeroDecimals ? 0 : 2,
      maximumFractionDigits: zeroDecimals ? 0 : 2,
    }).format(amount);
  } catch {
    return String(amount);
  }
}

/**
 * Convierte "YYYY-MM-DD" a "DD Mon" estilo corto.
 * - Usamos monthShortEs() para mantener consistencia con tu UI de analytics.
 * - Ej: "2026-02-13" -> "13 Feb"
 */
function formatAsOfHumanEs(yyyyMmDd: string): string {
  const y = Number(yyyyMmDd.slice(0, 4));
  const m = Number(yyyyMmDd.slice(5, 7));
  const d = Number(yyyyMmDd.slice(8, 10));

  // Date en UTC para evitar shifts raros del server
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  const mon = monthShortEs(dt);

  return `${pad2(d)} ${mon}`;
}

export default function buildMonthSummaryInsight({
  summary,
  currency,
  language,
}: BuildArgs) {
  const count = summary.meta.count ?? 0;

  // ---------------------------------------------------------------------------
  // Caso 0: sin gastos este mes (mensaje neutro, aplica con o sin historial)
  // ---------------------------------------------------------------------------
  if (count === 0) {
    return {
      kind: "no_data" as const,
      confidence: "low" as const,
      message:
        "Este mes aún no tienes gastos registrados. Registra al menos 1 para ver tu resumen.",
    };
  }

  // ---------------------------------------------------------------------------
  // Caso 1: hay datos -> total a hoy + top categorías
  // ---------------------------------------------------------------------------
  const asOf = formatAsOfHumanEs(summary.meta.to);
  const totalMoney = formatMoneySymbolOnly(summary.total, currency, language);

  const cats = summary.categories ?? [];
  const activeCategories = cats.length;

  // Qué mostrar (según tus reglas)
  // - 1 categoría: muestra 1
  // - 2-3: muestra todas
  // - >=4: top 3
  const shown =
    activeCategories <= 3 ? cats : cats.slice(0, 3);

  const lines: string[] = [];
  lines.push(`A hoy ${asOf}: ${totalMoney}`);

  shown.forEach((c, idx) => {
    const cfg = (CATEGORIES as any)[c.categoryId];
    const emoji = cfg?.emoji ? `${cfg.emoji} ` : "";
    const label = cfg?.label ?? c.categoryId;
    const amt = formatMoneySymbolOnly(c.amount, currency, language);

    const prefix = idx === 0 ? "Top" : `${idx + 1})`;
    lines.push(`${prefix}: ${emoji}${label} ${amt} (${pctShort(c.percent)})`);
  });

  // Top3% solo si hay >=5 categorías activas
  if (activeCategories >= 5) {
    const top3 = cats.slice(0, 3).reduce((acc, c) => acc + (c.percent || 0), 0);
    lines.push(`Top 3: ${pctShort(top3)}`);
  }

  const confidence = confidenceFromCount(count);

  return {
    kind: "summary" as const,
    confidence,
    message: lines.join("\n"),
  };
}