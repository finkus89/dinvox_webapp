// webapp/components/dashboard/DonutChart.tsx
// ------------------------------------------
// Dona estática de resumen (solo UI, sin datos reales todavía)

interface DonutSegment {
  percent: number; // 0–100 relativo al total
  color: string;   // color de la categoría
}

interface DonutChartProps {
  totalShort: string; // ej: "3.7M"
  currency: string;   // ej: "COP"
  label?: string;     // ej: "Total"
  segments?: DonutSegment[]; // categorías para la dona multicolor
}

export default function DonutChart({
  totalShort,
  currency,
  label = "Total",
  segments = [],
}: DonutChartProps) {
  // 🔹 Construir el conic-gradient a partir de los segmentos
  const totalPercent =
    segments.reduce((sum, seg) => sum + seg.percent, 0) || 1;

  let current = 0;
  const gradientStops = segments.map((seg) => {
    const span = (seg.percent / totalPercent) * 100;
    const start = current;
    const end = start + span;
    current = end;
    return `${seg.color} ${start}% ${end}%`;
  });

  const ringStyle: React.CSSProperties =
    segments.length > 0
      ? {
          backgroundImage: `conic-gradient(${gradientStops.join(", ")})`,
        }
      : {
          // fallback si no hay segmentos
          backgroundColor: "rgba(15,23,42,0.9)",
        };

  return (
    <div className="relative w-48 h-48 sm:w-90 sm:h-90 flex items-center justify-center">
      {/* Anillo exterior con segmentos por categoría */}
      <div
        className="
          w-full h-full rounded-full
          shadow-inner
        "
        style={ringStyle}
      />

      {/* Centro con total */}
      <div
        className="
          absolute inset-9 sm:inset-22
          rounded-full bg-slate-700
          flex flex-col items-center justify-center
        "
      >
        <span className="text-xs sm:text-2xl text-slate-400 mb-1">
          {label}
        </span>
        <span className="text-xl sm:text-4xl font-semibold">
          {totalShort}
        </span>
        <span className="text-xs sm:text-2xl text-slate-400">
          {currency}
        </span>
      </div>
    </div>
  );
}
