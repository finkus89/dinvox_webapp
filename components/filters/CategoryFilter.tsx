// webapp/components/filters/CategoryFilter.tsx
// ------------------------------------------------------
// Dropdown de categorías (solo UI, sin lógica de datos reales)

"use client";

interface CategoryFilterProps {
  value: string;                    // "all" | "comida" | ...
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
        {/* Comentario: luego esto se conectará a las categorías reales del usuario */}
        <option value="all">Todas las categorías</option>
        <option value="comida">Comida</option>
        <option value="transporte">Transporte</option>
        <option value="hogar">Hogar</option>
        <option value="ocio">Ocio</option>
      </select>
    </div>
  );
}
