// webapp/components/filters/DateRangePicker.tsx
// ------------------------------------------------------
// Componente reutilizable del selector de rango de fechas
// - Versión actual: usa <input type="date"> con calendario nativo del navegador
// - Trabaja con valores en formato "YYYY-MM-DD" (ej: "2025-11-01")

"use client";

interface DateRangePickerProps {
  from: string;           // Ej: "2025-11-01"
  to: string;             // Ej: "2025-11-30"
  onChangeFrom: (value: string) => void;
  onChangeTo: (value: string) => void;
}

export default function DateRangePicker({
  from,
  to,
  onChangeFrom,
  onChangeTo,
}: DateRangePickerProps) {
  return (
    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* DESDE */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">
          Desde
        </label>
        <input
          type="date"                      // 🔹 Calendario nativo
          value={from}                     // 🔹 Espera "YYYY-MM-DD" o "" (vacío)
          onChange={(e) => onChangeFrom(e.target.value)}
          className="
            w-full rounded-xl border border-white/15 bg-slate-900/60
            px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500
            focus:outline-none focus:ring-2 focus:ring-emerald-400/80
            calendar-input
          "
        />
      </div>

      {/* HASTA */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">
          Hasta
        </label>
        <input
          type="date"                      // 🔹 Calendario nativo
          value={to}                       // 🔹 Espera "YYYY-MM-DD" o "" (vacío)
          onChange={(e) => onChangeTo(e.target.value)}
          className="
            w-full rounded-xl border border-white/15 bg-slate-900/60
            px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500
            focus:outline-none focus:ring-2 focus:ring-emerald-400/80
            calendar-input
          "
        />
      </div>
    </div>
  );
}
