// src/app/(app)/performance/page.tsx
// ------------------------------------------------------------
// Dinvox | Desempeño del gasto (/performance)
//
// ✅ Performance Bundle (Data-Driven) — versión TZ-consistente
//
// Qué hace esta página:
// - Calcula rangos (from/to) en la timezone REAL del usuario (AppContext.timezone).
// - Calcula “hoy”, monthKey seleccionado, dayLimit y monthLabel en esa misma TZ.
// - Hace 1 solo fetch a /api/performance/bundle pasando rangos.
// - Parse correcto: el endpoint responde { bundle: {...} }.
// - Las cards NO hacen fetch ni usan new Date() para lógica temporal.
//   Reciben todo lo temporal resuelto desde aquí.
//
// Bundle esperado (definición acordada):
// - summaryCurrent: mes actual → hoy (TZ usuario)
// - dailyTotals: últimos 4 meses (incluye mes actual) → hoy
// - monthlyCategoryTotals: últimos 12 meses (incluye mes actual) → hoy
//
// Nota:
// - Evitamos toISOString() para construir YYYY-MM-DD.
// - Evitamos inconsistencias de timezone (no usar Date local en cards).
// ------------------------------------------------------------

"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";

import PeriodFilter from "@/components/filters/PeriodFilter";
import { Accordion } from "@/components/layout/Accordion";
import AccordionSection from "@/components/layout/AccordionSection";
import PageTabs from "@/components/layout/PageTabs";
import { BarChart3, Activity, LineChart } from "lucide-react";

import MonthThirdsCard from "@/components/performance/MonthThirdsCard";
import MonthRhythmCard from "@/components/performance/MonthRhythmCard";
import MonthlyEvolutionCard from "@/components/performance/MonthlyEvolutionCard";

import { useAppContext } from "@/lib/dinvox/app-context";
import { shiftMonthKey } from "@/lib/analytics/dates";

type MonthPeriodValue = "current_month" | "previous_month";
type HistoryPeriodValue = "last_6_months" | "last_12_months" | "year_to_date";
type PerformanceTab = "month" | "history";

const MONTH_ALLOWED: readonly MonthPeriodValue[] = [
  "current_month",
  "previous_month",
] as const;

const HISTORY_ALLOWED: readonly HistoryPeriodValue[] = [
  "last_6_months",
  "last_12_months",
  "year_to_date",
] as const;

const PERFORMANCE_TABS = [
  { value: "month", label: "Mes" },
  { value: "history", label: "Histórico" },
] as const;

// -----------------------
// Types esperados del bundle
// -----------------------

type BundleDailyTotal = {
  ymd: string; // "YYYY-MM-DD"
  total: number;
  txCount: number;
};

type BundleMonthlyCategoryTotal = {
  monthKey: string; // "YYYY-MM"
  categoryId: string;
  total: number;
  txCount: number;
};

type BundleShape = {
  dailyTotals: BundleDailyTotal[];
  monthlyCategoryTotals: BundleMonthlyCategoryTotal[];
  summaryCurrent?: unknown;
};

// Respuesta real del endpoint: { bundle: {...} }
type PerformanceBundleApiResponse = {
  bundle: BundleShape;
};

// -----------------------
// Helpers (bundle URL + filtrado local)
// -----------------------

function buildBundleUrl(params: {
  fromSummary: string;
  toSummary: string;
  fromDaily: string;
  toDaily: string;
  fromMonthly: string;
  toMonthly: string;
  transactionType?: "expense" | "income";
}) {
  const sp = new URLSearchParams();

  sp.set("fromSummary", params.fromSummary);
  sp.set("toSummary", params.toSummary);

  sp.set("fromDaily", params.fromDaily);
  sp.set("toDaily", params.toDaily);

  sp.set("fromMonthly", params.fromMonthly);
  sp.set("toMonthly", params.toMonthly);

  sp.set("transactionType", params.transactionType ?? "expense");

  return `/api/performance/bundle?${sp.toString()}`;
}

function filterDailyTotalsToMonth(
  dailyTotals: BundleDailyTotal[],
  monthKey: string
): { date: string; amount: number }[] {
  const rows = Array.isArray(dailyTotals) ? dailyTotals : [];
  return rows
    .filter(
      (r) => typeof r.ymd === "string" && r.ymd.startsWith(`${monthKey}-`)
    )
    .map((r) => ({
      date: r.ymd,
      amount: Number(r.total) || 0,
    }));
}

export default function PerformancePage() {
  const [tab, setTab] = useState<PerformanceTab>("month");

  const [monthPeriod, setMonthPeriod] =
    useState<MonthPeriodValue>("current_month");
  const [historyPeriod, setHistoryPeriod] =
    useState<HistoryPeriodValue>("last_6_months");

  const { currency, language, timezone } = useAppContext();

  // -----------------------
  // Clock + rangos en TZ real del usuario (IANA)
  // -----------------------
  const time = useMemo(() => {
    const zone = timezone || "America/Bogota";
    const now = DateTime.now().setZone(zone);

    const todayYmd = now.toFormat("yyyy-LL-dd"); // YYYY-MM-DD (TZ usuario)
    const todayDay = now.day; // 1..31 (TZ usuario)
    const currentMonthKey = now.toFormat("yyyy-LL"); // YYYY-MM (TZ usuario)
    const monthLabelEs = now.setLocale("es").toFormat("LLL yyyy"); // ej "feb 2026"

    // Rangos para bundle
    const fromSummary = now.startOf("month").toFormat("yyyy-LL-dd");

    const fromDaily = now
      .minus({ months: 3 })
      .startOf("month")
      .toFormat("yyyy-LL-dd");

    const fromMonthly = now
      .minus({ months: 11 })
      .startOf("month")
      .toFormat("yyyy-LL-dd");

    return {
      zone,
      now,
      todayYmd,
      todayDay,
      currentMonthKey,
      monthLabelEs,

      fromSummary,
      toSummary: todayYmd,
      fromDaily,
      toDaily: todayYmd,
      fromMonthly,
      toMonthly: todayYmd,
    };
  }, [timezone]);

  // -----------------------
  // Bundle state (fetch aquí)
  // -----------------------
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<BundleShape | null>(null);

  // Fetch bundle (solo depende del reloj TZ del usuario / rangos)
  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const url = buildBundleUrl({
          fromSummary: time.fromSummary,
          toSummary: time.toSummary,
          fromDaily: time.fromDaily,
          toDaily: time.toDaily,
          fromMonthly: time.fromMonthly,
          toMonthly: time.toMonthly,
          transactionType: "expense",
        });

        const res = await fetch(url, {
          method: "GET",
          signal: controller.signal,
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          const msg =
            payload?.error ??
            `Error al cargar bundle (${res.status} ${res.statusText}).`;
          throw new Error(msg);
        }

        const data = (await res.json()) as PerformanceBundleApiResponse;
        const b = data?.bundle;

        setBundle({
          dailyTotals: Array.isArray(b?.dailyTotals) ? b.dailyTotals : [],
          monthlyCategoryTotals: Array.isArray(b?.monthlyCategoryTotals)
            ? b.monthlyCategoryTotals
            : [],
          summaryCurrent: b?.summaryCurrent,
        });
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message ?? "Error desconocido al cargar el bundle.");
        setBundle(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [time]);

  // -----------------------
  // Derivados para MES (selector current/previous) — TODO en TZ usuario
  // -----------------------
  const selectedMonthKey = useMemo(() => {
    if (monthPeriod === "previous_month") {
      return shiftMonthKey(time.currentMonthKey, -1) ?? "unknown";
    }
    return time.currentMonthKey;
  }, [monthPeriod, time.currentMonthKey]);

  const selectedMonthLabel = useMemo(() => {
    // Etiqueta del mes seleccionado (es) sin depender del timezone del dispositivo:
    // - current: label de "now"
    // - previous: now - 1 mes
    if (monthPeriod === "previous_month") {
      return time.now.minus({ months: 1 }).setLocale("es").toFormat("LLL yyyy");
    }
    return time.monthLabelEs;
  }, [monthPeriod, time.now, time.monthLabelEs]);

  const dayLimit = useMemo(() => {
    // Mes actual: hoy (TZ usuario)
    // Mes anterior: último día del mes anterior (TZ usuario)
    if (monthPeriod === "previous_month") {
      return time.now
        .minus({ months: 1 })
        .endOf("month")
        .day;
    }
    return time.todayDay >= 1 ? time.todayDay : 1;
  }, [monthPeriod, time.now, time.todayDay]);

  // dailyTotals para ritmo
  const dailyTotalsForRhythm = bundle?.dailyTotals ?? [];

  // expenses para tercios (filtrados al mes seleccionado)
  const expensesForThirds = useMemo(() => {
    if (!bundle?.dailyTotals) return [];
    if (selectedMonthKey === "unknown") return [];

    const base = filterDailyTotalsToMonth(bundle.dailyTotals, selectedMonthKey);

    return base.map((r) => ({
      date: r.date,
      amount: r.amount,
      currency,
    }));
  }, [bundle?.dailyTotals, selectedMonthKey, currency]);

  // Si quieres que Tercios tenga estados correctos en TZ usuario:
  const todayDayForThirdStates = useMemo(() => {
    // Si es mes anterior, la card lo tratará como cerrado; aquí igual damos un número válido
    return time.todayDay >= 1 ? time.todayDay : 1;
  }, [time.todayDay]);

  // -----------------------
  // Render helpers (loading/error)
  // -----------------------
  function renderStatus() {
    if (loading) return <p className="text-sm text-white/80">Cargando…</p>;

    if (error) {
      return (
        <div className="rounded-2xl border border-red-200/40 bg-red-500/15 p-4">
          <p className="text-sm font-semibold text-red-100">Error</p>
          <p className="text-sm text-red-100/90 mt-1">{error}</p>
        </div>
      );
    }

    return null;
  }

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

      {tab === "month" ? (
        <Accordion defaultOpenKey="rhythm">
          <AccordionSection
            sectionKey="rhythm"
            title="Ritmo del mes"
            icon={<Activity className="h-5 w-5 text-slate-200" />}
          >
            {renderStatus() ?? (
              <MonthRhythmCard
                period={monthPeriod}
                dailyTotals={dailyTotalsForRhythm}
                // ✅ temporal resuelto en TZ usuario
                selectedMonthKey={selectedMonthKey}
                dayLimit={dayLimit}
                monthLabel={selectedMonthLabel}
                embedded
                fallbackCurrency={currency}
                fallbackLanguage={language}
              />
            )}
          </AccordionSection>

          <AccordionSection
            sectionKey="monththirds"
            title="Tercios del mes"
            icon={<BarChart3 className="h-5 w-5 text-slate-200" />}
          >
            {renderStatus() ?? (
              <MonthThirdsCard
                period={monthPeriod}
                expenses={expensesForThirds}
                // ✅ temporal resuelto en TZ usuario
                monthLabel={selectedMonthLabel}
                todayDay={todayDayForThirdStates}
                embedded
                fallbackCurrency={currency}
                fallbackLanguage={language}
              />
            )}
          </AccordionSection>
        </Accordion>
      ) : (
        <Accordion key={`history-${historyPeriod}`} defaultOpenKey="evolution">
          <AccordionSection
            sectionKey="evolution"
            title="Evolución mensual"
            icon={<LineChart className="h-5 w-5 text-slate-200" />}
          >
            {renderStatus() ?? (
              <MonthlyEvolutionCard
                period={historyPeriod}
                monthlyCategoryTotals={bundle?.monthlyCategoryTotals ?? []}
                embedded
                fallbackCurrency={currency}
                fallbackLanguage={language}
              />
            )}
          </AccordionSection>
        </Accordion>
      )}
    </>
  );
}