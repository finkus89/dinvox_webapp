// webapp/components/filters/DateRangePicker.tsx
// ------------------------------------------------------
// Componente reutilizable del selector de rango de fechas
// SOLO UI (los inputs dd/mm/aaaa), sin calendario ni validaciones todavía.

"use client";

interface DateRangePickerProps {
  from: string;           // Ej: "01/11/2025"
  to: string;             // Ej: "30/11/2025"
  onChangeFrom: (value: string) => void;
  onChangeTo: (value: string) => void;
}

export default function DateRangePicker({
  from,
  to,
  onChangeFrom,
  onChangeTo
}: DateRangePickerProps) {
  return (
    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
      
      {/* DESDE */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">
          Desde
        </label>
        <input
          type="text"
          placeholder="dd/mm/aaaa"
          value={from}
          onChange={(e) => onChangeFrom(e.target.value)}
          className="
            w-full rounded-xl border border-white/15 bg-slate-900/60
            px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500
            focus:outline-none focus:ring-2 focus:ring-emerald-400/80
          "
        />
      </div>

      {/* HASTA */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">
          Hasta
        </label>
        <input
          type="text"
          placeholder="dd/mm/aaaa"
          value={to}
          onChange={(e) => onChangeTo(e.target.value)}
          className="
            w-full rounded-xl border border-white/15 bg-slate-900/60
            px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500
            focus:outline-none focus:ring-2 focus:ring-emerald-400/80
          "
        />
      </div>

    </div>
  );
}
