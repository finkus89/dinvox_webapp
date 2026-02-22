// webapp/components/filters/PeriodFilter.tsx
// -----------------------------------------------------------------------------
// PeriodFilter (v3 - usando core Trigger + Panel)
//
// RESPONSABILIDAD:
// - Seleccionar un período (operational o analysis).
// - Mantener compatibilidad con:
//      value: T
//      onChange: (value: T)
// - Soporta `mode` y `allowedValues`.
//
// UX / COMPORTAMIENTO (coherente con el sistema):
// - Cerrado: muestra solo label del período seleccionado.
// - Abierto: lista premium (sin emojis).
// - Desktop: popover anclado.
// - Mobile: modal centrado + overlay.
// - ✅ Instant apply: al tocar una opción, aplica y cierra (sin botón "Aplicar").
// - ✅ Cierre consistente (ESC / click afuera / overlay): solo cierra,
//   porque no hay cambios pendientes (no existe draft).
//
// NOTA:
// - NO usa <select> nativo.
// - Reutiliza FilterField, FilterTrigger y FilterPanel.
// -----------------------------------------------------------------------------

"use client";

import { useMemo, useRef, useState } from "react";
import FilterField from "@/components/filters/FilterField";
import FilterTrigger from "@/components/filters/FilterTrigger";
import FilterPanel from "@/components/filters/FilterPanel";

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
  | "last_6_months"
  | "last_12_months"
  | "year_to_date";

interface PeriodFilterProps<T extends string = PeriodFilterValue> {
  value: T;
  onChange: (value: T) => void;
  mode?: PeriodFilterMode;
  allowedValues?: readonly T[];
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
  allowedValues,
}: PeriodFilterProps<T>) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const baseOptions = PERIOD_OPTIONS[mode];

  const options = useMemo(() => {
    if (!allowedValues?.length) return baseOptions;
    return baseOptions.filter((opt) =>
      (allowedValues as readonly string[]).includes(opt.value)
    );
  }, [baseOptions, allowedValues]);

  const summaryText = useMemo(() => {
    const match = baseOptions.find((opt) => opt.value === value);
    return match?.label ?? value;
  }, [value, baseOptions]);

  function pick(next: T) {
    onChange(next);
    setOpen(false);
  }

  function closeOnly() {
    setOpen(false);
  }

  const PanelContent = (
    <div
      className="
        rounded-2xl border border-white/10
        bg-slate-950/95 backdrop-blur-xl shadow-2xl
        overflow-hidden
      "
      role="dialog"
      aria-label="Seleccionar período"
    >
      <div className="px-3 py-3">
        <div className="max-h-[55vh] sm:max-h-64 overflow-auto pr-1 space-y-1">
          {options.map((opt) => {
            const checked = value === (opt.value as T);

            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => pick(opt.value as T)}
                className="
                  w-full flex items-center justify-between gap-3
                  rounded-xl px-2.5 py-2
                  hover:bg-slate-900/50 transition
                  text-left
                "
              >
                <span className="text-sm text-slate-100 truncate">
                  {opt.label}
                </span>

                <span
                  className={[
                    "h-4 w-4 rounded border shrink-0",
                    checked
                      ? "bg-emerald-500/90 border-emerald-300"
                      : "bg-transparent border-white/20",
                  ].join(" ")}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <FilterField label="Filtra por período">
      <div ref={wrapRef} className="relative">
        <FilterTrigger open={open} onClick={() => setOpen((v) => !v)}>
          {summaryText}
        </FilterTrigger>

        <FilterPanel open={open} wrapperRef={wrapRef} onClose={closeOnly}>
          {PanelContent}
        </FilterPanel>
      </div>
    </FilterField>
  );
}