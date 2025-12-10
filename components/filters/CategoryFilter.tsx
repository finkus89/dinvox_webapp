// webapp/components/filters/CategoryFilter.tsx
"use client";

import { CATEGORIES } from "@/lib/dinvox/categories";
import type { CategoryId } from "@/lib/dinvox/categories";

interface CategoryFilterProps {
  value: string | "all";                     // "all" | CategoryId
  onChange: (value: string) => void;
}

export default function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <div className="flex-1">
      <label className="block text-xs font-medium text-slate-300 mb-1">
        Categorías
      </label>

      <select
        className="
          w-full rounded-xl border border-white/15 bg-slate-900/60
          px-3 py-2 text-sm text-slate-100
          focus:outline-none focus:ring-2 focus:ring-emerald-400/80
        "
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {/* Opción para ver todo */}
        <option value="all">Todas las categorías</option>

        {/* Opciones dinámicas reales */}
        {Object.entries(CATEGORIES).map(([id, cfg]) => (
          <option key={id} value={id}>
            {cfg.label}
          </option>
        ))}
      </select>
    </div>
  );
}
