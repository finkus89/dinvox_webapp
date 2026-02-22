// webapp/components/filters/MultiCategoryFilter.tsx
// -----------------------------------------------------------------------------
// MultiCategoryFilter (v2 - usando core Trigger + Panel)
//
// - Filtro de categorías MULTI-selección (para la tabla).
// - value: CategoryId[]  (array vacío = "todas", o sea: NO filtra)
// - onChange: recibe el array ordenado al presionar "Aplicar"
//
// UX / COMPORTAMIENTO:
// - Trigger cerrado: consistente con el resto de filtros (mismo look base).
// - Panel “premium”: fondo oscuro, emojis, checks.
// - Mobile: se abre como modal centrado con overlay + footer sticky.
// - Desktop: popover anclado al trigger.
// - Cierre consistente:
//    • ESC
//    • click afuera (desktop)
//    • tap en overlay (mobile)
//   -> Siempre revierte cambios NO aplicados (vuelve draft a value).
//
// NOTA:
// - Este componente NO usa <select> nativo. Todo es UI custom.
// - Reutiliza FilterField (label/estructura), FilterTrigger (input cerrado),
//   y FilterPanel (overlay+popover + cierre).
// -----------------------------------------------------------------------------

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/dinvox/categories";
import type { CategoryId } from "@/lib/dinvox/categories";

// Base wrappers de filtros (coherencia UI)
import FilterField from "@/components/filters/FilterField";
import FilterTrigger from "@/components/filters/FilterTrigger";
import FilterPanel from "@/components/filters/FilterPanel";

type MultiCategoryFilterProps = {
  // Array vacío = "todas" (no filtrar)
  value: CategoryId[];
  onChange: (value: CategoryId[]) => void;
  label?: string;
};

export default function MultiCategoryFilter({
  value,
  onChange,
  label = "Categorías",
}: MultiCategoryFilterProps) {
  const [open, setOpen] = useState(false);

  // Borrador interno para permitir "Aplicar" (no cambia hasta que confirmes)
  const [draft, setDraft] = useState<CategoryId[]>(value);

  // Wrapper que contiene trigger + panel (necesario para click-outside en desktop)
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Mantener draft sincronizado si cambia value desde afuera (ej. reset desde padre)
  useEffect(() => {
    setDraft(value);
  }, [value]);

  const allIds = useMemo(() => Object.keys(CATEGORIES) as CategoryId[], []);
  const isAll = draft.length === 0;

  const summaryText = useMemo(() => {
    // Cerrado: SIN emojis (coherencia con sistema)
    if (!value || value.length === 0) return "Todas las categorías";

    // 1–2: muestra labels (más útil)
    if (value.length <= 2) {
      return value.map((id) => CATEGORIES[id]?.label ?? id).join(", ");
    }

    // 3+: "Comida +2" (compacto)
    const first = value[0];
    const firstLabel = CATEGORIES[first]?.label ?? first;
    return `${firstLabel} +${value.length - 1}`;
  }, [value]);

  function toggleDraft(id: CategoryId) {
    setDraft((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  }

  function apply() {
    // Orden fijo según el orden de CATEGORIES para consistencia
    const ordered = allIds.filter((id) => draft.includes(id));
    onChange(ordered);
    setOpen(false);
  }

  function clearAll() {
    setDraft([]); // vacío = todas (sin filtro)
  }

  function selectAll() {
    setDraft(allIds);
  }

  function closeAndRevert() {
    setOpen(false);
    setDraft(value); // revertir cambios NO aplicados
  }

  // --- Contenido del panel premium (se renderiza dentro del FilterPanel) ---
  const PanelContent = (
    <div
      className="
        rounded-2xl border border-white/10
        bg-slate-950/95 backdrop-blur-xl shadow-2xl
        overflow-hidden
      "
      role="dialog"
      aria-label="Seleccionar categorías"
    >
      {/* Header acciones */}
      <div className="p-3 pb-2">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={clearAll}
            className="
              text-xs rounded-lg px-2 py-1
              border border-white/10 bg-slate-900/50
              text-slate-200 hover:bg-slate-900/70 transition
            "
            title="Ver todas (sin filtrar)"
          >
            Todas
          </button>

          <button
            type="button"
            onClick={selectAll}
            className="
              text-xs rounded-lg px-2 py-1
              border border-white/10 bg-slate-900/50
              text-slate-200 hover:bg-slate-900/70 transition
            "
            title="Seleccionar todas (equivale a marcar cada una)"
          >
            Seleccionar todas
          </button>
        </div>
      </div>

      {/* Lista scrolleable */}
      <div className="px-3 pb-3">
        <div className="max-h-[55vh] sm:max-h-64 overflow-auto pr-1 space-y-1">
          {allIds.map((id) => {
            const cfg = CATEGORIES[id];
            const checked = draft.includes(id);

            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleDraft(id)}
                className="
                  w-full flex items-center justify-between gap-3
                  rounded-xl px-2.5 py-2
                  hover:bg-slate-900/50 transition
                  text-left
                "
              >
                <div className="flex items-center gap-2 min-w-0">
                  {/* Abierto: emojis SI */}
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

      {/* Footer sticky (siempre visible) */}
      <div
        className="
          sticky bottom-0
          border-t border-white/10
          bg-slate-950/95
          px-3 py-3
          pb-[calc(0.75rem+env(safe-area-inset-bottom))]
        "
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-300">
            {isAll ? "Aplicará: todas las categorías" : `Seleccionadas: ${draft.length}`}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeAndRevert}
              className="
                text-xs rounded-xl px-3 py-1.5
                border border-white/10 bg-slate-900/50
                text-slate-200 hover:bg-slate-900/70 transition
              "
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={apply}
              className="
                text-xs rounded-xl px-3 py-1.5
                border border-emerald-400/60 bg-emerald-500/90
                text-slate-900 font-semibold
                hover:bg-emerald-400 hover:border-emerald-300 transition
              "
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <FilterField label={label}>
      <div ref={wrapRef} className="relative">
        {/* Trigger cerrado (sin emojis) */}
        <FilterTrigger open={open} onClick={() => setOpen((v) => !v)}>
          {summaryText}
        </FilterTrigger>

        {/* Panel (desktop popover / mobile modal) */}
        <FilterPanel open={open} wrapperRef={wrapRef} onClose={closeAndRevert}>
          {PanelContent}
        </FilterPanel>
      </div>
    </FilterField>
  );
}