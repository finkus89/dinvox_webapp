// components/layout/PageTabs.tsx
// ------------------------------------------------------------
// Tabs reutilizables estilo "browser" para páginas.
// - Soporta N pestañas.
// - Mantiene buen contraste para tab inactivo.
// - No maneja rutas: solo UI + state externo (controlled).
//
// Mejoras visuales:
// - Activo con más "lift" (sombra + borde mejor).
// - Inactivo con menos ruido (borde más suave) pero legible.
// - Separación real tipo navegador (gap + z-index).
// - Línea base integrada (parece barra del navegador).
//
// 🆕 3 mejoras sutiles (solo aquí):
// 1) Transición más fina: transition-colors + transition-transform (no "all").
// 2) Micro-lift: inactivo baja 1px, activo queda arriba (sensación browser).
// 3) Micro-interacción: hover sube levemente (solo si no está activo).
// ------------------------------------------------------------

"use client";

import type { ReactNode } from "react";

export type PageTabOption<T extends string> = {
  value: T;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
};

type PageTabsProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  tabs: readonly PageTabOption<T>[];
  ariaLabel?: string;
  className?: string;
};

export default function PageTabs<T extends string>({
  value,
  onChange,
  tabs,
  ariaLabel = "Tabs",
  className = "",
}: PageTabsProps<T>) {
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-end gap-2" role="tablist" aria-label={ariaLabel}>
        {tabs.map((t) => {
          const active = t.value === value;

          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={t.disabled}
              onClick={() => onChange(t.value)}
              className={[
                // base
                "relative px-4 py-2 text-sm font-medium rounded-t-2xl",
                // 🆕 1) transición fina (no transition-all)
                "transition-colors transition-transform duration-200 ease-out",
                "focus:outline-none focus:ring-2 focus:ring-emerald-400/60",
                t.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",

                // borde base (más tipo browser)
                "border border-b-0",

                // estado
                active
                  ? [
                      // pestaña activa: más sólida + lift
                      "z-10",
                      "bg-slate-900/70 text-slate-100",
                      "border-white/20",
                      "shadow-[0_-6px_18px_rgba(0,0,0,0.22)]",
                      // 🆕 2) activo queda “arriba”
                      "translate-y-0",
                    ].join(" ")
                  : [
                      // pestaña inactiva: legible pero discreta
                      "z-0",
                      "bg-slate-900/25 text-slate-200",
                      "border-white/10",
                      // 🆕 2) inactivo baja 1px (se siente detrás)
                      "translate-y-[1px]",
                      // hover: mejor contraste + micro lift
                      "hover:bg-slate-900/35 hover:border-white/15 hover:text-slate-100",
                      // 🆕 3) hover sube un toque (solo en inactivo)
                      "hover:translate-y-0",
                    ].join(" "),
              ].join(" ")}
            >
              <span className="inline-flex items-center gap-2">
                {t.icon ? (
                  <span className="inline-flex items-center opacity-90">
                    {t.icon}
                  </span>
                ) : null}
                {t.label}
              </span>

              {/* “corte” visual para que la pestaña activa se una con el contenido */}
              {active ? (
                <span className="pointer-events-none absolute left-0 right-0 -bottom-px h-px bg-slate-900/70" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Línea/base debajo de las pestañas (barra) */}
      <div className="h-px w-full bg-white/10" />
    </div>
  );
}