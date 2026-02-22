// webapp/components/filters/CategoryFilter.tsx
// -----------------------------------------------------------------------------
// CategoryFilter (v3 - Single selección, usando core Trigger + Panel)
//
// RESPONSABILIDAD:
// - Permitir seleccionar UNA sola categoría o "all" (sin filtro).
// - Mantener compatibilidad con lógica legacy:
//      value: "all" | CategoryId
//      onChange: (value: string)
//
// UX / COMPORTAMIENTO (coherente con el sistema):
// - Cerrado: muestra solo texto (SIN emojis).
// - Abierto: lista premium con emojis.
// - "Todas las categorías": opción sin emoji.
// - Desktop: popover anclado al trigger.
// - Mobile: modal centrado + overlay.
// - ✅ Instant apply: al tocar una opción, aplica y cierra (sin botón "Aplicar").
// - ✅ Cierre consistente (ESC / click afuera / overlay): no requiere revert,
//   porque no hay cambios pendientes (no existe draft).
//
// NOTA:
// - Este componente NO usa <select> nativo.
// - Reutiliza FilterField (label/estructura), FilterTrigger (input cerrado),
//   y FilterPanel (overlay+popover + cierre).
// -----------------------------------------------------------------------------

"use client";

import { useMemo, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/dinvox/categories";
import type { CategoryId } from "@/lib/dinvox/categories";

import FilterField from "@/components/filters/FilterField";
import FilterTrigger from "@/components/filters/FilterTrigger";
import FilterPanel from "@/components/filters/FilterPanel";

interface CategoryFilterProps {
  value: string | "all"; // "all" | CategoryId
  onChange: (value: string) => void;
  label?: string;
}

export default function CategoryFilter({
  value,
  onChange,
  label = "Categorías",
}: CategoryFilterProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const allIds = useMemo(() => Object.keys(CATEGORIES) as CategoryId[], []);

  // Cerrado: SIN emojis
  const summaryText = useMemo(() => {
    if (!value || value === "all") return "Todas las categorías";
    return CATEGORIES[value as CategoryId]?.label ?? value;
  }, [value]);

  function pick(next: string | "all") {
    onChange(next);
    setOpen(false);
  }

  // Para single instant: cerrar solo cierra (sin revert)
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
      aria-label="Seleccionar categoría"
    >
      <div className="px-3 py-3">
        <div className="max-h-[55vh] sm:max-h-64 overflow-auto pr-1 space-y-1">
          {/* "Todas" sin emoji */}
          <button
            type="button"
            onClick={() => pick("all")}
            className="
              w-full flex items-center justify-between gap-3
              rounded-xl px-2.5 py-2
              hover:bg-slate-900/50 transition
              text-left
            "
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm text-slate-100 truncate">
                Todas las categorías
              </span>
            </div>

            <span
              className={[
                "h-4 w-4 rounded border shrink-0",
                value === "all"
                  ? "bg-emerald-500/90 border-emerald-300"
                  : "bg-transparent border-white/20",
              ].join(" ")}
              aria-hidden="true"
            />
          </button>

          {/* Categorías con emoji */}
          {allIds.map((id) => {
            const cfg = CATEGORIES[id];
            const checked = value === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => pick(id)}
                className="
                  w-full flex items-center justify-between gap-3
                  rounded-xl px-2.5 py-2
                  hover:bg-slate-900/50 transition
                  text-left
                "
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">{cfg?.emoji ?? ""}</span>
                  <span className="text-sm text-slate-100 truncate">
                    {cfg?.label ?? id}
                  </span>
                </div>

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
    <FilterField label={label}>
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