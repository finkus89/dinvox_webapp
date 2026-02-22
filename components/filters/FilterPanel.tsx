// webapp/components/filters/FilterPanel.tsx
// -----------------------------------------------------------------------------
// FilterPanel (contenedor reusable para panel de filtros)
//
// RESPONSABILIDAD:
// - Desktop: popover anclado debajo del trigger (absolute).
// - Mobile: modal centrado + overlay (fixed).
// - Maneja cierre por:
//    • ESC
//    • click fuera (desktop)
//    • tap en overlay (mobile)
//
// NO maneja:
// - Qué contenido hay dentro (children).
// - Botones aplicar/cancelar (eso vive en el filtro).
//
// REQUISITO:
// - El contenedor padre del trigger debe ser `relative` para que el popover
//   absolute se posicione bien en desktop.
// -----------------------------------------------------------------------------

"use client";

import { useEffect, useState } from "react";

type FilterPanelProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;

  // Para click-outside en desktop:
  // wrapperRef debe envolver trigger + panel (como en MultiCategory)
  wrapperRef: React.RefObject<HTMLDivElement | null>;
};

function useIsMobile(breakpointPx = 640) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function compute() {
      setIsMobile(window.innerWidth < breakpointPx);
    }
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [breakpointPx]);

  return isMobile;
}

export default function FilterPanel({
  open,
  onClose,
  children,
  wrapperRef,
}: FilterPanelProps) {
  const isMobile = useIsMobile();

  // ESC
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Click fuera (solo desktop)
  useEffect(() => {
    if (!open) return;
    if (isMobile) return;

    function onDocClick(e: MouseEvent) {
      const el = wrapperRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, isMobile, onClose, wrapperRef]);

  if (!open) return null;

  // Desktop popover
  if (!isMobile) {
    return (
      <div className="absolute z-50 mt-2 w-full">
        {children}
      </div>
    );
  }

  // Mobile modal
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="presentation"
    >
      {/* Overlay */}
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60"
        aria-label="Cerrar"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative w-[min(92vw,420px)] max-h-[80vh]">
        {children}
      </div>
    </div>
  );
}