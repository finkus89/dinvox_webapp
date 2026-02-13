// webapp/components/dashboard/SummaryCard.tsx
// ------------------------------------------
// Tarjeta de resumen del dashboard Dinvox.
// - Usa /api/summary para traer total y categorías del período seleccionado.
// - Muestra filtro de período, dona y barras por categoría.
//
// Fuente de verdad para currency/language:
// - Se leen SIEMPRE desde AppContext (inyectado por app/(app)/layout.tsx)
// - /api/summary NO debe “mandar” currency/language para UI (si lo hace, lo ignoramos aquí)

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import CategoryBars from "./CategoryBars";
import DonutChart from "./DonutChart";
import PeriodFilter, {
  PeriodFilterValue,
} from "@/components/filters/PeriodFilter";
import DateRangePicker from "@/components/filters/DateRangePicker";
import {
  PeriodState,
  formatDateHuman,
  getPeriodDates,
} from "@/lib/dinvox/periods";

// 🔹 Config de categorías (para obtener el label a partir del id)
import { CATEGORIES } from "@/lib/dinvox/categories";
import type { CategoryId } from "@/lib/dinvox/categories";

// 🆕 Helper central de dinero (currency + language)
import { formatMoney } from "@/lib/dinvox/expenses-utils";

// 🆕 Contexto global (currency + language vienen del layout)
import { useAppContext } from "@/lib/dinvox/app-context";

// -------------------------
// Tipos API summary (para graficar)
// -------------------------
type SummaryCategoryApi = {
  categoryId: CategoryId;
  amount: number;
  percent: number;
};

type SummaryApiResponse = {
  total: number;
  categories: SummaryCategoryApi[];
  // meta la ignoramos por ahora
};

export default function SummaryCard() {
  // Router para navegar a la tabla de gastos con filtros
  const router = useRouter();

  // 🆕 Contexto global (source of truth)
  const { currency: ctxCurrency, language: ctxLanguage } = useAppContext();

  // 🔹 Estado de período (UN solo objeto en vez de 3 estados separados)
  //    Por defecto usamos "month" con from/to del mes actual
  const [period, setPeriod] = useState<PeriodState>(() => {
    const initialType: PeriodFilterValue = "month";
    const { from, to } = getPeriodDates(initialType);
    return {
      type: initialType,
      from,
      to,
    };
  });

  // Datos de /api/summary
  const [summaryData, setSummaryData] = useState<SummaryApiResponse | null>(
    null
  );
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // 🔹 Flag de UI: si es rango, mostramos el DateRangePicker
  const isRange = period.type === "range";

  // 🆕 Fuente de verdad para formateo (desde layout)
  // Nota: por seguridad mantenemos defaults si por alguna razón el contexto aún no está listo.
  const currency = useMemo(
    () => (ctxCurrency ?? "COP").toUpperCase(),
    [ctxCurrency]
  );
  const language = useMemo(() => ctxLanguage ?? "es-CO", [ctxLanguage]);

  // 🔹 Cada vez que cambia el período (type, from, to),
  //    llamamos a /api/summary para traer el resumen real.
  useEffect(() => {
    if (!period.from || !period.to) return;

    const controller = new AbortController();

    const fetchSummary = async () => {
      try {
        setIsLoadingSummary(true);
        setSummaryError(null);

        const params = new URLSearchParams({
          from: period.from, // siempre "YYYY-MM-DD"
          to: period.to,
        });

        const res = await fetch(`/api/summary?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          throw new Error(errBody?.error || `Error HTTP ${res.status}`);
        }

        const data: SummaryApiResponse = await res.json();
        setSummaryData(data);
      } catch (err: any) {
        // Si el fetch se aborta por cambio rápido de filtros, lo ignoramos.
        if (err?.name === "AbortError") return;

        console.error("Error al cargar summary:", err);
        setSummaryError(err.message || "Error al cargar el resumen");
      } finally {
        // Evita “parpadeos” raros cuando el fetch fue abortado
        if (!controller.signal.aborted) {
          setIsLoadingSummary(false);
        }
      }
    };

    fetchSummary();

    return () => controller.abort();
  }, [period]);

  // 🔹 Resumen activo en UI
  const total = summaryData?.total ?? 0;
  const categories = summaryData?.categories ?? [];

  // 🔹 Versión corta del total para la dona (ej: "2.8M")
  // 🆕 separadores según language (sin símbolo)
  const totalShort = useMemo(() => {
    if (total >= 1_000_000) return `${(total / 1_000_000).toFixed(1)}M`;

    return new Intl.NumberFormat(language, {
      maximumFractionDigits: 0,
    }).format(total);
  }, [total, language]);

  // 🆕 Total exacto con símbolo y decimales correctos (EUR/USD 2, COP 0)
  const totalFormatted = useMemo(
    () => formatMoney(total, currency, language),
    [total, currency, language]
  );

  // 🔹 Array de segmentos para la dona (mismos colores de categorías)
  const DONUT_SEGMENTS = useMemo(
    () =>
      categories.map((cat) => ({
        percent: cat.percent,
        color: CATEGORIES[cat.categoryId].color,
      })),
    [categories]
  );

  // 🔹 Datos para las barras de categorías, derivados del summary activo
  const CATEGORY_BARS_DATA = useMemo(
    () =>
      categories.map((cat) => ({
        categoryId: cat.categoryId,
        name: CATEGORIES[cat.categoryId].label,
        amount: formatMoney(cat.amount, currency, language),
        percent: cat.percent,
        color: CATEGORIES[cat.categoryId].color,
      })),
    [categories, currency, language]
  );

  // 🔹 Ir a la pantalla de "Tabla de gastos" respetando el período actual
  function handleGoToExpenses() {
    const params = new URLSearchParams();

    params.set("periodType", period.type);

    if (period.type === "range") {
      if (period.from) params.set("from", period.from);
      if (period.to) params.set("to", period.to);
    }

    const qs = params.toString();
    router.push(qs ? `/expenses?${qs}` : "/expenses");
  }

  // 🔹 Ir a la tabla de gastos filtrando por una categoría específica
  function handleCategoryClick(categoryId: CategoryId) {
    const params = new URLSearchParams();

    params.set("periodType", period.type);

    if (period.type === "range") {
      if (period.from) params.set("from", period.from);
      if (period.to) params.set("to", period.to);
    }

    params.set("category", categoryId);

    const qs = params.toString();
    router.push(qs ? `/expenses?${qs}` : "/expenses");
  }

  return (
    <section
      className="
        rounded-3xl border border-white/10
        bg-gradient-to-br from-slate-700 via-slate-600 to-brand-500 backdrop-blur-xl shadow-xl
        text-slate-100 p-4 sm:p-6 md:p-8 lg:p-8 xl:p-8
      "
    >
      {/* Título + filtro de período (responsive) */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        {/* Título y descripción breve */}
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Resumen de gastos</h2>

          {/* 🔹 Información visible para el usuario sobre el rango usado */}
          <p className="text-xs text-slate-200/85">
            {total > 0 ? (
              <>
                Mostrando gastos desde{" "}
                <span className="font-semibold">
                  {formatDateHuman(period.from)}
                </span>{" "}
                hasta{" "}
                <span className="font-semibold">
                  {formatDateHuman(period.to)}
                </span>
                .
              </>
            ) : (
              <>
                No hay gastos registrados entre{" "}
                <span className="font-semibold">
                  {formatDateHuman(period.from)}
                </span>{" "}
                y{" "}
                <span className="font-semibold">
                  {formatDateHuman(period.to)}
                </span>
                .
              </>
            )}
          </p>

          {/* 🔹 Error de summary, si existe */}
          {summaryError && !isLoadingSummary && (
            <p className="text-[11px] text-red-100/90">{summaryError}</p>
          )}

          {/* 🔹 Mensaje breve cuando está actualizando datos */}
          {isLoadingSummary && (
            <p className="text-[11px] text-emerald-100/90">
              Actualizando datos del resumen…
            </p>
          )}
        </div>

        {/* Filtro por período */}
        <div className="w-full md:w-72">
          <PeriodFilter
            value={period.type}
            onChange={(newType) => {
              if (newType === "range") {
                setPeriod((prev) => ({
                  ...prev,
                  type: newType,
                }));
              } else {
                const { from, to } = getPeriodDates(newType);
                setPeriod({
                  type: newType,
                  from,
                  to,
                });
              }
            }}
          />
        </div>
      </div>

      {/* Si el usuario elige "Rango de fechas", mostramos inputs de rango */}
      {isRange && (
        <DateRangePicker
          from={period.from}
          to={period.to}
          onChangeFrom={(value) =>
            setPeriod((prev) => ({ ...prev, from: value }))
          }
          onChangeTo={(value) =>
            setPeriod((prev) => ({ ...prev, to: value }))
          }
        />
      )}

      {/* CONTENIDO PRINCIPAL: 2 COLUMNAS EN DESKTOP */}
      <div className="relative">
        {/* Overlay de "cargando" sobre toda la tarjeta de gráficos */}
        {isLoadingSummary && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-slate-900/50">
            <div className="flex flex-col items-center gap-2 text-xs sm:text-sm text-slate-100/90">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-100 border-t-transparent" />
              <span>Actualizando datos…</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUMNA IZQUIERDA: DONA + TOTAL + BOTÓN */}
          <div className="lg:col-span-2 flex flex-col">
            <div
              className="
                w-full
                rounded-2xl border border-white/10
                bg-gradient-to-br from-slate-500 via-slate-600 to-brand-700
                px-4 py-6 sm:px-6 sm:py-8
                flex flex-col items-center gap-4
              "
            >
              {/* Dona */}
              <DonutChart
                totalShort={totalShort}
                currency={currency}
                segments={DONUT_SEGMENTS}
              />

              {/* Total exacto */}
              <div className="text-center">
                <p className="text-sm sm:text-base text-slate-200 tracking-wide">
                  Gasto Total
                </p>
                <p className="text-base sm:text-lg font-bold text-slate-100">
                  {totalFormatted}
                </p>
              </div>

              {/* Botón dentro del mismo card */}
              <button
                type="button"
                onClick={handleGoToExpenses}
                className="
                  mt-1
                  inline-flex items-center justify-center
                  rounded-xl border border-emerald-400/60
                  bg-emerald-500/90 px-4 py-1.5
                  text-xs sm:text-sm font-semibold text-slate-900
                  hover:bg-emerald-400 hover:border-emerald-300
                  transition
                "
              >
                Ver registros
              </button>
            </div>
          </div>

          {/* COLUMNA DERECHA: CATEGORÍAS CON BARRAS */}
          <CategoryBars
            data={CATEGORY_BARS_DATA}
            onCategoryClick={handleCategoryClick}
          />
        </div>
      </div>
    </section>
  );
}
