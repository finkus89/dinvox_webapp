// webapp/components/filters/FilterField.tsx
// -----------------------------------------------------------------------------
// FilterField (Base UI Wrapper para filtros en Dinvox)
//
// RESPONSABILIDAD:
// - Unificar estructura visual de TODOS los filtros.
// - Renderiza:
//      • Contenedor con flex-1 y min-w-0 (para buen comportamiento en grid)
//      • Label consistente (tipografía, color, spacing)
//      • children (control interno: select, trigger, etc.)
//
// NO maneja:
// - Lógica de estado
// - Eventos
// - Popovers
// - Mobile modal
//
// OBJETIVO:
// - Eliminar duplicación de <label> + wrapper en cada filtro.
// - Garantizar coherencia visual.
// - Facilitar futura migración a sistema premium completo.
//
// USO:
//
// <FilterField label="Categorías">
//    <MultiCategoryFilter ... />
// </FilterField>
//
// -----------------------------------------------------------------------------

"use client";

import { ReactNode } from "react";

interface FilterFieldProps {
  label: string;
  children: ReactNode;
  className?: string; // opcional para ajustes puntuales
}

export default function FilterField({
  label,
  children,
  className = "",
}: FilterFieldProps) {
  return (
    <div
      className={`flex-1 min-w-0 ${className}`}
    >
      {/* Label estándar para todos los filtros */}
      <label
        className="
          block text-xs font-medium
          text-slate-300
          mb-1
        "
      >
        {label}
      </label>

      {/* Contenido del filtro (select, trigger, etc.) */}
      {children}
    </div>
  );
}