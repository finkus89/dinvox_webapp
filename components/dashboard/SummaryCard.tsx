// webapp/components/dashboard/SummaryCard.tsx
// ------------------------------------------
// Tarjeta de resumen del dashboard Dinvox.
// - Usa /api/summary para traer total y categorías del período seleccionado.
// - Muestra filtro de período, dona y barras por categoría.

"use client";

import { useState, useEffect } from "react";
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

//tipos para gaurdar lo q recibe de la api summary con los datos a graficar
type SummaryCategoryApi = {
  categoryId: CategoryId;
  amount: number;
  percent: number;
};

type SummaryApiResponse = {
  total: number;
  currency: string;
  categories: SummaryCategoryApi[];
  // meta la ignoramos por ahora
};

// 🔹 Helper simple para formatear montos cortos tipo "$650.000"
const formatAmountShort = (value: number): string =>
  `$${new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(value)}`;

export default function SummaryCard() {

  // Router para navegar a la tabla de gastos con filtros
  const router = useRouter();
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

  /// para la api
  const [summaryData, setSummaryData] = useState<SummaryApiResponse | null>(
    null
  );
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  // 🔹 Flag de UI: si es rango, mostramos el DateRangePicker
  const isRange = period.type === "range";
  // 🔹 Cada vez que cambia el período (type, from, to),
  //    llamamos a /api/summary para traer el resumen real.
  useEffect(() => {
    // Si no tenemos from/to, no hacemos nada
    if (!period.from || !period.to) {
      return;
    }

    const fetchSummary = async () => {
      try {
        setIsLoadingSummary(true);
        setSummaryError(null);

        const params = new URLSearchParams({
          from: period.from, // siempre "YYYY-MM-DD"
          to: period.to,
        });

        const res = await fetch(`/api/summary?${params.toString()}`);

        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          throw new Error(errBody?.error || `Error HTTP ${res.status}`);
        }

        const data: SummaryApiResponse = await res.json();

        setSummaryData(data);
        console.log("✅ Summary desde API:", data);
      } catch (err: any) {
        console.error("Error al cargar summary:", err);
        setSummaryError(err.message || "Error al cargar el resumen");
      } finally {
        setIsLoadingSummary(false);
      }
    };

    fetchSummary();
  }, [period]);

  // 🔹 Elegimos qué resumen usar en la UI:
  //    - summaryData → datos reales de la API
  //    - summaryMock → fallback temporal mientras tanto
  const summaryBase = summaryData;
  const total = summaryBase?.total ?? 0;
  const currency = summaryBase?.currency ?? "COP";
  const categories = summaryBase?.categories ?? [];

  // 🔹 Versión corta del total para la dona (ej: "2.8M")
  const totalShort =
    total >= 1_000_000
      ? `${(total / 1_000_000).toFixed(1)}M`
      : new Intl.NumberFormat("es-CO", {
          maximumFractionDigits: 0,
        }).format(total);

  // 🔹 Versión completa para el texto de "Total: ..."
  const totalFormatted = new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(total);

  // 🔹 Array de segmentos para la dona (mismos colores de categorías)
  const DONUT_SEGMENTS = categories.map((cat) => ({
    percent: cat.percent,
    color: CATEGORIES[cat.categoryId].color,
  }));

  // 🔹 Datos para las barras de categorías, derivados del summary activo
  const CATEGORY_BARS_DATA = categories.map((cat) => ({
    categoryId: cat.categoryId,
    name: CATEGORIES[cat.categoryId].label,
    amount: formatAmountShort(cat.amount),
    percent: cat.percent,
    color: CATEGORIES[cat.categoryId].color,
  }));

    // 🔹 Ir a la pantalla de "Tabla de gastos" respetando el período actual
  function handleGoToExpenses() {
    const params = new URLSearchParams();

    // Siempre mandamos el tipo de período
    params.set("periodType", period.type);
    // Si estamos en "rango", mandamos from/to explícitos
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

    // Tipo de período actual
    params.set("periodType", period.type);

    // Si estamos en rango, también mandamos from/to
    if (period.type === "range") {
      if (period.from) params.set("from", period.from);
      if (period.to) params.set("to", period.to);
    }

    // Filtro de categoría
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
            <p className="text-[11px] text-red-100/90">
              {summaryError}
            </p>
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
              // 🔹 Cuando el usuario cambia el período:
              //    - actualizamos el type
              //    - si NO es "range", calculamos automáticamente from/to
              //    - si es "range", dejamos que el usuario ponga from/to manualmente
              if (newType === "range") {
                setPeriod((prev) => ({
                  ...prev,
                  type: newType,
                  // dejamos from/to como estén; el usuario los ajustará con el DateRangePicker
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
            // 🔹 Actualizamos SOLO la fecha "desde" dentro del estado de período
            setPeriod((prev) => ({ ...prev, from: value }))
          }
          onChangeTo={(value) =>
            // 🔹 Actualizamos SOLO la fecha "hasta" dentro del estado de período
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
          {/* COLUMNA IZQUIERDA: DONA + TOTAL */}
          {/* COLUMNA IZQUIERDA: DONA + TOTAL + BOTÓN (todo en un solo card) */}
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
                  {`$${totalFormatted} ${currency}`}
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
