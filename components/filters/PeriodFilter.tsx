// webapp/components/filters/PeriodFilter.tsx
// ------------------------------------------
// Filtro de período reutilizable (Hoy, semana, 7 días, mes, rango, etc.)
// felitro para analisi reutilizable (este mes, mes anterior, ultimo s3 , ultimos 6, año corrido)
// - Solo maneja UI y emite el valor seleccionado al padre

"use client";
export type PeriodFilterMode = "operational" | "analysis";

export type PeriodFilterValue =
  | "today"
  | "week"
  | "7d"
  | "month"
  | "prev_month"
  | "range";

export type AnalysisPeriodValue =
  | "current_month"
  | "previous_month"
  | "last_12_months"
  | "last_6_months"
  | "year_to_date";

interface PeriodFilterProps<T extends string = PeriodFilterValue> {
  value: T;
  onChange: (value: T) => void;
  mode?: PeriodFilterMode; // 👈 opcional
}

const PERIOD_OPTIONS = {
  operational: [
    { value: "today", label: "Hoy" },
    { value: "week", label: "Esta semana" },
    { value: "7d", label: "Últimos 7 días" },
    { value: "month", label: "Este mes" },
    { value: "prev_month", label: "Mes anterior" },
    { value: "range", label: "Rango de fechas" },
  ],
  analysis: [
    { value: "current_month", label: "Este mes" },
    { value: "previous_month", label: "Mes anterior" },
    { value: "last_6_months", label: "Últimos 6 meses" },
    { value: "last_12_months", label: "Últimos 12 meses" },
    { value: "year_to_date", label: "Este año" },
  ],
} as const;


export default function PeriodFilter<T extends string>({
    value,
    onChange,
    mode = "operational",
  }: PeriodFilterProps<T>) {
  const options = PERIOD_OPTIONS[mode];

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
        onChange={(e) => onChange(e.target.value as T)}
      >
        {/* aqui se poen los labels q corresponden */}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
