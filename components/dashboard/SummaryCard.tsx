// webapp/components/dashboard/SummaryCard.tsx
// ------------------------------------------
// Tarjeta de resumen del dashboard Dinvox (solo UI, sin datos reales)
// - Filtros arriba (período + categorías) con <select>
// - Layout 2 columnas en desktop: Dona (izquierda) + Categorías (derecha)
// - En móvil se apilan una debajo de la otra
// - Valores y categorías son placeholders (mock) por ahora

"use client";

import { useState } from "react";
import CategoryBars from "./CategoryBars";
import DonutChart from "./DonutChart";
import PeriodFilter, {
  PeriodFilterValue,
} from "@/components/filters/PeriodFilter";
import DateRangePicker from "@/components/filters/DateRangePicker";
import CategoryFilter from "@/components/filters/CategoryFilter";



// 🔹 Mock de resumen consolidado (como lo devolverá el hook real)
import { MOCK_SUMMARY_DATA } from "@/lib/mock/summary-mock";
// 🔹 Config de categorías (para obtener el label a partir del id)
import { CATEGORIES } from "@/lib/dinvox/categories";

// 🔹 Helper simple para formatear montos cortos tipo "$650.000"
const formatAmountShort = (value: number): string =>
  `$${new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(value)}`;

// 🔹 Array de categorías mock derivado del resumen consolidado
//    (ya viene ordenado de mayor a menor desde MOCK_SUMMARY_DATA)
const MOCK_CATEGORIES = MOCK_SUMMARY_DATA.categories.map((cat) => ({
  name: CATEGORIES[cat.categoryId].label,
  amount: formatAmountShort(cat.amount),
  percent: cat.percent,
  color: CATEGORIES[cat.categoryId].color,
}));



export default function SummaryCard() {

  // 🔹 Resumen mock (luego vendrá del hook real useExpensesSummary)
  const summary = MOCK_SUMMARY_DATA;
  // 🔹 Estado SOLO de UI para el filtro de fecha (no hay datos reales todavía)
  const [dateFilter, setDateFilter] = useState<PeriodFilterValue>("month");
  const isRange = dateFilter === "range";
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

   // 🔹 Versión corta del total para la dona (ej: "2.8M")
  const totalShort =
    summary.total >= 1_000_000
      ? `${(summary.total / 1_000_000).toFixed(1)}M`
      : new Intl.NumberFormat("es-CO", {
          maximumFractionDigits: 0,
        }).format(summary.total);

  // 🔹 Versión completa para el texto de "Total: ..."
  const totalFormatted = new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(summary.total);

  // 🔹 Array de segmentos para la dona (mismos colores de categorías)
  const DONUT_SEGMENTS = summary.categories.map((cat) => ({
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
          
        </div>

        {/* Filtro por período */}
        <div className="w-full md:w-72">
          <PeriodFilter value={dateFilter} onChange={setDateFilter} />
        </div>
      </div>


      {/* Si el usuario elige "Rango de fechas", mostramos inputs de rango (UI sola, sin lógica) */}
      {isRange && (
        <DateRangePicker
          from={rangeFrom}
          to={rangeTo}
          onChangeFrom={setRangeFrom}
          onChangeTo={setRangeTo}
        />
      )}


      {/* CONTENIDO PRINCIPAL: 2 COLUMNAS EN DESKTOP */}
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
              currency={summary.currency}
              segments={DONUT_SEGMENTS}
            /> 

          </div>

          {/* Nota con total exacto (placeholder) */}
          <div className="text-center mt-2 sm:mt-4">
            <p className="text-sm sm:text-base text-slate-300 tracking-wide">
              Gasto Total
            </p>
            <p className="text-base sm:text-lg font-bold text-slate-100">
              {`$${totalFormatted} ${summary.currency}`}
            </p>
          </div>
        </div>


        {/* COLUMNA DERECHA: CATEGORÍAS CON BARRAS */}
        <CategoryBars data={MOCK_CATEGORIES} />


      </div>
    </section>
  );
}
