// webapp/components/dashboard/SummaryCard.tsx
// ------------------------------------------
// Tarjeta de resumen del dashboard Dinvox (solo UI, sin datos reales)
// - Filtros arriba (período + categorías) con <select>
// - Layout 2 columnas en desktop: Dona (izquierda) + Categorías (derecha)
// - En móvil se apilan una debajo de la otra
// - Valores y categorías son placeholders (mock) por ahora

"use client";

import { useState, useEffect } from "react";
import CategoryBars from "./CategoryBars";
import DonutChart from "./DonutChart";
import PeriodFilter, {
  PeriodFilterValue,
} from "@/components/filters/PeriodFilter";
import DateRangePicker from "@/components/filters/DateRangePicker";

// 🔹 Mock de resumen consolidado (como lo devolverá el hook real)
import { MOCK_SUMMARY_DATA } from "@/lib/mock/summary-mock";
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

// 🔹 Estado unificado de período
//    - type: valor del <select> (today, week, 7d, month, prev_month, range)
//    - from/to: fechas concretas en formato "YYYY-MM-DD"
type PeriodState = {
  type: PeriodFilterValue;
  from: string;
  to: string;
};

// 🔹 Helper: formatea un Date a "YYYY-MM-DD"
function formatDateISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// 🔹 Helper: formatea "YYYY-MM-DD" a algo legible para el usuario ("01 nov 2025")
function formatDateHuman(isoDate: string): string {
  if (!isoDate) return "-";

  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;

  const [year, month, day] = parts;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  if (Number.isNaN(date.getTime())) return isoDate;

  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// 🔹 Helper: calcula from/to según el tipo de período
//    Nota: por ahora usamos semana actual (lunes–domingo), mes actual y mes anterior
function getPeriodDates(type: PeriodFilterValue): { from: string; to: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const clampToToday = (date: Date) => {
    return date > today ? new Date(today) : date;
  };

  if (type === "today") {
    const from = formatDateISO(today);
    const to = formatDateISO(today);
    return { from, to };
  }

  if (type === "7d") {
    const toDate = new Date(today);
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - 6);
    return {
      from: formatDateISO(fromDate),
      to: formatDateISO(clampToToday(toDate)),
    };
  }

  if (type === "week") {
    const day = today.getDay(); // 0 = domingo, 1 = lunes, ...
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const toDate = clampToToday(sunday);

    return {
      from: formatDateISO(monday),
      to: formatDateISO(toDate),
    };
  }

  if (type === "month") {
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const toDate = clampToToday(lastDay);

    return {
      from: formatDateISO(firstDay),
      to: formatDateISO(toDate),
    };
  }

  if (type === "prev_month") {
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstPrev = new Date(year, month - 1, 1);
    const lastPrev = new Date(year, month, 0);

    return {
      from: formatDateISO(firstPrev),
      to: formatDateISO(lastPrev),
    };
  }

  return { from: "", to: "" };
}

export default function SummaryCard() {
  // 🔹 Resumen mock (fallback mientras no haya datos de la API)
  const summaryMock = MOCK_SUMMARY_DATA;

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

  // 🔹 Filtro de categorías (aún no se usa en la lógica, solo reservado)
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

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
  const summaryBase = summaryData ?? summaryMock;

  // 🔹 Versión corta del total para la dona (ej: "2.8M")
  const totalShort =
    summaryBase.total >= 1_000_000
      ? `${(summaryBase.total / 1_000_000).toFixed(1)}M`
      : new Intl.NumberFormat("es-CO", {
          maximumFractionDigits: 0,
        }).format(summaryBase.total);

  // 🔹 Versión completa para el texto de "Total: ..."
  const totalFormatted = new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(summaryBase.total);

  // 🔹 Array de segmentos para la dona (mismos colores de categorías)
  const DONUT_SEGMENTS = summaryBase.categories.map((cat) => ({
    percent: cat.percent,
    color: CATEGORIES[cat.categoryId].color,
  }));

  // 🔹 Datos para las barras de categorías, derivados del summary activo
  const CATEGORY_BARS_DATA = summaryBase.categories.map((cat) => ({
    name: CATEGORIES[cat.categoryId].label,
    amount: formatAmountShort(cat.amount),
    percent: cat.percent,
    color: CATEGORIES[cat.categoryId].color,
  }));

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
            {summaryBase.total > 0 ? (
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
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Placeholder de gráfico de dona */}
            <div
              className="
                w-full flex items-center justify-center
                rounded-2xl border border-white/10 bg-gradient-to-br from-slate-500 via-slate-600 to-brand-700
                px-4 py-6 sm:px-6 sm:py-8
              "
            >
              {/* Dona como componente reutilizable */}
              <DonutChart
                totalShort={totalShort}
                currency={summaryBase.currency}
                segments={DONUT_SEGMENTS}
              />
            </div>

            {/* Nota con total exacto */}
            <div className="text-center mt-2 sm:mt-4">
              <p className="text-sm sm:text-base text-slate-300 tracking-wide">
                Gasto Total
              </p>
              <p className="text-base sm:text-lg font-bold text-slate-100">
                {`$${totalFormatted} ${summaryBase.currency}`}
              </p>
            </div>
          </div>

          {/* COLUMNA DERECHA: CATEGORÍAS CON BARRAS */}
          <CategoryBars data={CATEGORY_BARS_DATA} />
        </div>
      </div>
    </section>
  );
}
