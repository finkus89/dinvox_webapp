// webapp/components/filters/PeriodFilter.tsx
// ------------------------------------------
// Filtro de período reutilizable (Hoy, semana, 7 días, mes, rango, etc.)
// - Solo maneja UI y emite el valor seleccionado al padre

"use client";

export type PeriodFilterValue =
  | "today"
  | "week"
  | "7d"
  | "month"
  | "prev_month"
  | "range";

interface PeriodFilterProps {
  value: PeriodFilterValue;
  onChange: (value: PeriodFilterValue) => void;
}

export default function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div className="flex-1">
      <label className="block text-xs font-medium text-slate-300 mb-1">
        Filtra por período
      </label>
      <select
        className="
          w-full rounded-xl border border-white/15 bg-slate-900/60
          px-3 py-2 text-sm text-slate-100
          focus:outline-none focus:ring-2 focus:ring-emerald-400/80
        "
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value as PeriodFilterValue
          )
        }
      >
        {/* Comentario: los value son claves internas; luego se mapearán a rangos de fechas reales */}
        <option value="today">Hoy</option>
        <option value="week">Esta semana</option>
        <option value="7d">Últimos 7 días</option>
        <option value="month">Este mes</option>
        <option value="prev_month">Mes anterior</option>
        <option value="range">Rango de fechas</option>
      </select>
    </div>
  );
}
