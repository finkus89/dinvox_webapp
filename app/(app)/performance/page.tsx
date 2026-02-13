// src/app/(app)/performance/page.tsx
// ------------------------------------------------------------
// Dinvox | Desempeño del gasto (/performance)
//
// Contexto:
// - El "cascarón" común (Sidebar + Header + PageContainer + banner trial)
//   vive en: src/app/(app)/layout.tsx
// - Esta página SOLO renderiza el contenido específico de /performance.
//
// Qué hace esta página:
// - Renderiza el filtro de período (modo "analysis").
// - Define qué secciones mostrar según el período seleccionado.
// - Muestra las secciones dentro de un Accordion.
// - Las cards internas (MonthThirdsCard / MonthRhythmCard / MonthlyEvolutionCard)
//   son responsables de cargar datos (fetch) y deben manejar AbortController
//   si hacen requests en useEffect.
//
// Nota importante:
// - Aquí ya NO se hace fetch del usuario.
// - Si alguna card requiere moneda/idioma, idealmente debe leer AppContext.
//   (Por ahora, si la card aún recibe fallbacks, los pasaremos desde AppContext allí.)
// ------------------------------------------------------------

"use client";

import { useMemo, useState } from "react";
import PeriodFilter, { AnalysisPeriodValue } from "@/components/filters/PeriodFilter";
import { Accordion } from "@/components/layout/Accordion";
import AccordionSection from "@/components/layout/AccordionSection";
import { BarChart3, Activity, LineChart } from "lucide-react";

import MonthThirdsCard from "@/components/performance/MonthThirdsCard";
import MonthRhythmCard from "@/components/performance/MonthRhythmCard";
import MonthlyEvolutionCard from "@/components/performance/MonthlyEvolutionCard";

// 🆕 moneda/idioma global (source of truth desde layout)
import { useAppContext } from "@/lib/dinvox/app-context";

// Secciones visibles por período seleccionado
const PERFORMANCE_SECTIONS_BY_PERIOD: Record<AnalysisPeriodValue, string[]> = {
  current_month: ["monththirds", "rhythm", "distribution", "projection"],
  previous_month: ["monththirds", "rhythm", "distribution"],
  last_12_months: ["evolution", "patterns"],
  last_6_months: ["evolution", "patterns"],
  year_to_date: ["evolution", "patterns"],
};

export default function PerformancePage() {
  // Filtro de período (analysis)
  const [period, setPeriod] = useState<AnalysisPeriodValue>("current_month");

  // Fuente de verdad: moneda/idioma desde AppContext (layout)
  const { currency, language } = useAppContext();

  // Secciones visibles para el período seleccionado
  const visibleSections = useMemo(
    () => PERFORMANCE_SECTIONS_BY_PERIOD[period],
    [period]
  );

  return (
    <>
      {/* Filtro de período */}
      <div className="mb-6 max-w-xs">
        <PeriodFilter mode="analysis" value={period} onChange={setPeriod} />
      </div>

      {/* Secciones según filtro */}
      <Accordion defaultOpenKey={visibleSections[0]}>
        {/* TERCIOS */}
        {visibleSections.includes("monththirds") && (
          <AccordionSection
            sectionKey="monththirds"
            title="Tercios del mes"
            icon={<BarChart3 className="h-5 w-5 text-slate-200" />}
          >
            {(period === "current_month" || period === "previous_month") && (
              <MonthThirdsCard
                period={period}
                embedded
                // (Transición) si esta card aún usa fallbacks:
                fallbackCurrency={currency}
                fallbackLanguage={language}
              />
            )}
          </AccordionSection>
        )}

        {/* RITMO */}
        {visibleSections.includes("rhythm") && (
          <AccordionSection
            sectionKey="rhythm"
            title="Ritmo del mes"
            icon={<Activity className="h-5 w-5 text-slate-200" />}
          >
            {(period === "current_month" || period === "previous_month") && (
              <MonthRhythmCard
                period={period}
                embedded
                fallbackCurrency={currency}
                fallbackLanguage={language}
              />
            )}
          </AccordionSection>
        )}

        {/* EVOLUCIÓN */}
        {visibleSections.includes("evolution") &&
          (period === "last_6_months" ||
            period === "last_12_months" ||
            period === "year_to_date") && (
            <AccordionSection
              sectionKey="evolution"
              title="Evolución mensual"
              icon={<LineChart className="h-5 w-5 text-slate-200" />}
            >
              <MonthlyEvolutionCard
                period={period}
                embedded
                fallbackCurrency={currency}
                fallbackLanguage={language}
              />
            </AccordionSection>
          )}
      </Accordion>
    </>
  );
}
