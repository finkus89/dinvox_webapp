// src/components/performance/MonthThirdsBarChart.tsx
// -----------------------------------------------------------------------------
// Gráfico de barras (v1) para "Tercios del mes".
// - NO calcula métricas: solo renderiza con t1/t2/t3 y pctT1/pctT2/pctT3.
// - Sin eje Y (para evitar confusión).
// - Monto real por tercio visible encima de cada barra.
// - % dentro de la barra.
// -----------------------------------------------------------------------------

"use client";

import { useMemo } from "react";
import { formatMoney as formatMoneyUI } from "@/lib/dinvox/expenses-utils"; // ✅

type Props = {
  t1: number;
  t2: number;
  t3: number;

  pctT1: number;
  pctT2: number;
  pctT3: number;

  currency?: string;
  language?: string; // ✅ nuevo
  maxHeightPx?: number;
};

type BarItem = {
  key: "T1" | "T2" | "T3";
  label: string;
  amount: number;
  pct: number;
};

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function pctLabel(p: number) {
  return `${Math.round(clamp01(p) * 100)}%`;
}

export default function MonthThirdsBarChart({
  t1,
  t2,
  t3,
  pctT1,
  pctT2,
  pctT3,
  currency = "COP",
  language = "es-CO",
  maxHeightPx = 190,
}: Props) {
  const data: BarItem[] = useMemo(
    () => [
      { key: "T1", label: "T1", amount: t1, pct: pctT1 },
      { key: "T2", label: "T2", amount: t2, pct: pctT2 },
      { key: "T3", label: "T3", amount: t3, pct: pctT3 },
    ],
    [t1, t2, t3, pctT1, pctT2, pctT3]
  );

  const maxValue = useMemo(() => {
    const m = Math.max(...data.map((d) => d.amount));
    return Number.isFinite(m) ? m : 0;
  }, [data]);

  const barHeightPx = (value: number) => {
    if (!maxValue || maxValue <= 0) return 0;
    const ratio = Math.max(0, value) / maxValue;
    const px = Math.round(ratio * maxHeightPx);
    if (value > 0) return Math.max(16, px);
    return 0;
  };

  // ✅ Usa símbolo/decimales/locale reales
  const moneyLabel = (v: number) => formatMoneyUI(v, currency, language);

  return (
    <div className="w-full">
      <div className="relative z-10">
        <p className="text-sm font-semibold text-white/90">
          Distribución por tercios
        </p>
        <p className="text-xs text-white/60">
          Monto por tercio y % sobre el total del mes.
        </p>
      </div>

      <div className="relative z-0 mt-5">
        <div className="flex items-end justify-between gap-3">
          {data.map((d) => {
            const h = barHeightPx(d.amount);

            return (
              <div key={d.key} className="flex-1">
                <div className="mb-2 text-center">
                  <span className="text-[12px] text-white/80">
                    {moneyLabel(d.amount)}
                  </span>
                </div>

                {/* SIN contenedor visible (sin borde / sin ring / sin caja 100%) */}
                <div
                  className="relative w-full overflow-hidden rounded-lg bg-transparent"
                  style={{ height: maxHeightPx }}
                >
                  {/* Barra (fill) */}
                  <div
                    className="
                      absolute bottom-0 left-0 right-0
                      rounded-lg
                      bg-gradient-to-b from-cyan-300 via-teal-500 to-emerald-700
                      shadow-[0_-8px_24px_rgba(16,185,129,0.18)]
                    "
                    style={{ height: h }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                  </div>

                  {/* % dentro */}
                  {h > 0 ? (
                    <div
                      className="
                        absolute
                        left-1/2
                        -translate-x-1/2
                        text-white
                        font-semibold
                        text-base
                        drop-shadow
                        select-none
                      "
                      style={{ bottom: Math.max(8, h / 2 - 8) }}
                    >
                      {pctLabel(d.pct)}
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-base text-white/35">0%</span>
                    </div>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-center">
                  <span className="text-xs font-semibold text-white/80">
                    {d.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-[11px] text-white/55">
          % calculado sobre el total registrado del mes.
        </p>
      </div>
    </div>
  );
}
