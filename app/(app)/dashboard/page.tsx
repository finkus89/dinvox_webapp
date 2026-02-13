// src/app/(app)/dashboard/page.tsx
// ------------------------------------------------------------
// Dinvox | Dashboard
//
// Nota:
// El "cascarón" común (Sidebar + Header + PageContainer + banner de trial)
// vive en: src/app/(app)/layout.tsx
//
// Esta página SOLO renderiza el contenido del dashboard.
// ------------------------------------------------------------

"use client";

import SummaryCard from "@/components/dashboard/SummaryCard";

export default function DashboardPage() {
  // SummaryCard ahora toma currency/language desde AppContext (layout),
  // así que ya no necesita fallbacks por props.
  return <SummaryCard />;
}
