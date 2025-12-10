// webapp/components/dashboard/CategoryBars.tsx
// ---------------------------------------------
// Lista de categorías con barras horizontales
// Reutilizable en el dashboard (solo UI, sin lógica de datos)
import type { CategoryId } from "@/lib/dinvox/categories";

interface CategoryBarItem {
  categoryId: CategoryId;
  name: string;
  amount: string;  // ej: "$165.000"
  percent: number; // ej: 40
  color?: string;  // color opcional (ej: desde CATEGORIES[categoryId].color)
}

interface CategoryBarsProps {
  data: CategoryBarItem[];
  onCategoryClick?: (categoryId: CategoryId) => void;
}

export default function CategoryBars({ data, onCategoryClick }: CategoryBarsProps) {
  // 🔹 Encontrar el porcentaje máximo para escalar las barras
  const maxPercent =
    data.length > 0
      ? Math.max(...data.map((cat) => cat.percent))
      : 1;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-100">
          Distribución por categoría
        </h3>
      </div>

      <div className="space-y-2">
        {data.map((cat) => {
          const relativeWidth = (cat.percent / maxPercent) * 100;

          return (
            <button
              key={cat.categoryId}
              type="button"
              onClick={() => onCategoryClick?.(cat.categoryId)}
              className="w-full text-left space-y-1 rounded-lg hover:bg-slate-900/30 transition cursor-pointer"
            >
              {/* Primera línea: nombre + monto + porcentaje en la misma fila */}
              <div className="flex items-center justify-between text-[11px] sm:text-xs">
                <span className="text-slate-200 truncate">{cat.name}</span>

                <div className="flex items-center gap-2 text-right">
                  <span className="text-slate-100 font-medium">
                    {cat.amount}
                  </span>
                  <span className="text-slate-300">
                    {cat.percent}%
                  </span>
                </div>
              </div>

              {/* Barra de proporción (escalada al mayor) */}
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${relativeWidth}%`,
                    backgroundColor: cat.color ?? "#22c55e", // fallback emerald
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
