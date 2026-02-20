// src/app/(app)/performance/page.tsx
// ------------------------------------------------------------
// Dinvox | Desempeño del gasto (/performance)
//
// Qué hace esta página (UX final):
// - Filtro siempre arriba a la derecha.
// - Tabs reutilizables arriba (Mes / Histórico).
// - Mes: Ritmo + Tercios (filtro: este mes / mes anterior)
// - Histórico: Evolución (filtro: 6m / 12m / año)
// ------------------------------------------------------------

"use client";

import { useState } from "react";
import PeriodFilter from "@/components/filters/PeriodFilter";
import { Accordion } from "@/components/layout/Accordion";
import AccordionSection from "@/components/layout/AccordionSection";
import PageTabs from "@/components/layout/PageTabs";
import { BarChart3, Activity, LineChart } from "lucide-react";

import MonthThirdsCard from "@/components/performance/MonthThirdsCard";
import MonthRhythmCard from "@/components/performance/MonthRhythmCard";
import MonthlyEvolutionCard from "@/components/performance/MonthlyEvolutionCard";

import { useAppContext } from "@/lib/dinvox/app-context";

type MonthPeriodValue = "current_month" | "previous_month";
type HistoryPeriodValue = "last_6_months" | "last_12_months" | "year_to_date";

type PerformanceTab = "month" | "history";

const MONTH_ALLOWED: readonly MonthPeriodValue[] = ["current_month", "previous_month"] as const;

const HISTORY_ALLOWED: readonly HistoryPeriodValue[] = [
  "last_6_months",
  "last_12_months",
  "year_to_date",
] as const;

const PERFORMANCE_TABS = [
  { value: "month", label: "Mes" },
  { value: "history", label: "Histórico" },
] as const;

export default function PerformancePage() {
  const [tab, setTab] = useState<PerformanceTab>("month");

  const [monthPeriod, setMonthPeriod] = useState<MonthPeriodValue>("current_month");
  const [historyPeriod, setHistoryPeriod] = useState<HistoryPeriodValue>("last_6_months");

  const { currency, language } = useAppContext();

  return (
    <>
      {/* Header row: Tabs (izquierda) + Filtro (derecha) */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <PageTabs<PerformanceTab>
          value={tab}
          onChange={setTab}
          tabs={PERFORMANCE_TABS}
          ariaLabel="Pestañas de desempeño"
        />

        {/* Filtro (misma ubicación) */}
        <div className="w-full max-w-xs">
          {tab === "month" ? (
            <PeriodFilter<MonthPeriodValue>
              mode="analysis"
              value={monthPeriod}
              onChange={setMonthPeriod}
              allowedValues={MONTH_ALLOWED}
            />
          ) : (
            <PeriodFilter<HistoryPeriodValue>
              mode="analysis"
              value={historyPeriod}
              onChange={setHistoryPeriod}
              allowedValues={HISTORY_ALLOWED}
            />
          )}
        </div>
      </div>

      {/* Contenido según pestaña */}
      {tab === "month" ? (
        <Accordion key={`month-${monthPeriod}`} defaultOpenKey="rhythm">
          <AccordionSection
            sectionKey="rhythm"
            title="Ritmo del mes"
            icon={<Activity className="h-5 w-5 text-slate-200" />}
          >
            <MonthRhythmCard
              period={monthPeriod}
              embedded
              fallbackCurrency={currency}
              fallbackLanguage={language}
            />
          </AccordionSection>

          <AccordionSection
            sectionKey="monththirds"
            title="Tercios del mes"
            icon={<BarChart3 className="h-5 w-5 text-slate-200" />}
          >
            <MonthThirdsCard
              period={monthPeriod}
              embedded
              fallbackCurrency={currency}
              fallbackLanguage={language}
            />
          </AccordionSection>
        </Accordion>
      ) : (
        <Accordion key={`history-${historyPeriod}`} defaultOpenKey="evolution">
          <AccordionSection
            sectionKey="evolution"
            title="Evolución mensual"
            icon={<LineChart className="h-5 w-5 text-slate-200" />}
          >
            <MonthlyEvolutionCard
              period={historyPeriod}
              embedded
              fallbackCurrency={currency}
              fallbackLanguage={language}
            />
          </AccordionSection>
        </Accordion>
      )}
    </>
  );
}