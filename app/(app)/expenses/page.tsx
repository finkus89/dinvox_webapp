// src/app/(app)/expenses/page.tsx
// ------------------------------------------------------------
// Dinvox | Tabla de gastos
//
// Contexto:
// - El "cascarón" común (Sidebar + Header + PageContainer + banner trial)
//   vive en: src/app/(app)/layout.tsx
// - Esta página SOLO se encarga del contenido propio de /expenses.
//
// Qué hace esta página:
// - Lee filtros iniciales desde la URL (querystring):
//     ?periodType=today|week|7d|month|prev_month|range
//     ?from=YYYY-MM-DD&to=YYYY-MM-DD
//     ?category=<categoryId>
// - Pasa esos filtros iniciales a ExpensesTableCard para que la tabla
//   arranque ya filtrada (ej: cuando navegas desde Dashboard).
//
// Notas:
// - Ya NO se hace fetch del usuario aquí (eso lo hace el layout).
// - Currency/Language para formateo deben venir desde AppContext dentro
//   de ExpensesTableCard (o mantener fallbacks por ahora si aún no migraste).
// ------------------------------------------------------------

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ExpensesTableCard from "@/components/expenses/ExpensesTableCard";
import type { PeriodFilterValue } from "@/components/filters/PeriodFilter";

function ExpensesPageInner() {
  // 🔹 Leer filtros iniciales desde la URL (?from=...&to=...&category=...&periodType=...)
  const searchParams = useSearchParams();

  const rawPeriodType = searchParams.get("periodType");
  const allowedPeriodTypes: PeriodFilterValue[] = [
    "today",
    "week",
    "7d",
    "month",
    "prev_month",
    "range",
  ];

  const periodTypeParam = allowedPeriodTypes.includes(
    rawPeriodType as PeriodFilterValue
  )
    ? (rawPeriodType as PeriodFilterValue)
    : undefined;

  const fromParam = searchParams.get("from") ?? undefined;
  const toParam = searchParams.get("to") ?? undefined;
  const categoryParam = searchParams.get("category") ?? undefined;

  return (
    <ExpensesTableCard
      // Filtros iniciales que vienen desde el Dashboard (si existen)
      initialPeriodType={periodTypeParam}
      initialFrom={fromParam}
      initialTo={toParam}
      initialCategory={categoryParam}
    />
  );
}

export default function ExpensesPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-slate-100 text-slate-700 text-sm">
          Cargando tabla de gastos…
        </div>
      }
    >
      <ExpensesPageInner />
    </Suspense>
  );
}
