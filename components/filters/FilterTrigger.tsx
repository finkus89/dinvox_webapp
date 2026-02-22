// webapp/components/filters/FilterTrigger.tsx
// -----------------------------------------------------------------------------
// FilterTrigger (UI base del filtro cerrado)
//
// RESPONSABILIDAD:
// - Botón base que reemplaza <select>.
// - Look consistente (fondo/borde/blur/focus ring) para TODOS los filtros.
// - Muestra texto (summary) truncado + caret (▼ / ▲).
//
// NO maneja:
// - Estado open/close (lo recibe por props)
// - Panel / modal
// - Lógica de selección
// -----------------------------------------------------------------------------

"use client";

import type { ReactNode } from "react";

type FilterTriggerProps = {
  open: boolean;
  onClick: () => void;
  children: ReactNode; // summary text
  className?: string;
};

export default function FilterTrigger({
  open,
  onClick,
  children,
  className = "",
}: FilterTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-xl border border-white/15 bg-slate-900/60",
        "px-3 py-2 text-sm text-slate-100 text-left",
        "focus:outline-none focus:ring-2 focus:ring-emerald-400/80",
        "flex items-center justify-between gap-3",
        "min-w-0",
        className,
      ].join(" ")}
      aria-haspopup="dialog"
      aria-expanded={open}
    >
      <span className="truncate">{children}</span>
      <span className="text-slate-300 shrink-0">{open ? "▲" : "▼"}</span>
    </button>
  );
}