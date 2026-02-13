// src/components/settings/SubscriptionInfoCard.tsx
// ------------------------------------------------------------
// Dinvox | SubscriptionInfoCard
//
// UI pura (sin título ni contenedor principal).
// Sigue el mismo patrón visual que AccountInfoCard.
//
// Muestra:
// - Estado (badge con color)
// - Fecha relevante (trial_end_at o paid_until, formateada)
// - Mensaje contextual (sin fechas)
// - Indicador tester (si aplica)
//
// Nota:
// - Formatea fechas con helpers existentes (periods.ts) para consistencia.
// ------------------------------------------------------------

"use client";

import type { ReactNode } from "react";

import {
  getSubscriptionMeta,
  type SubscriptionStatus,
} from "@/lib/dinvox/subscription-meta";

// ✅ Reutiliza helpers existentes (ya usados en Settings)
import { formatDateISO, formatDateHuman } from "@/lib/dinvox/periods";
import { useAppContext } from "@/lib/dinvox/app-context";

type Props = {
  status: SubscriptionStatus;
  trialEndAt?: string | null; // timestamptz (ISO)
  paidUntil?: string | null;  // timestamptz (ISO)
  isTester?: boolean;
};

// -----------------------
// Helper: formatear timestamptz -> "humano"
// -----------------------
function formatTimestamptzHuman(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const iso = formatDateISO(d); // YYYY-MM-DD
  return formatDateHuman(iso);  // formato humano (tu helper)
}

export default function SubscriptionInfoCard({
  status,
  trialEndAt = null,
  paidUntil = null,
  isTester = false,
}: Props) {
  const { canUse, canUseReason, subscriptionStatus } = useAppContext();
  const meta = getSubscriptionMeta(subscriptionStatus, canUse, canUseReason);


  // -----------------------
  // Fecha relevante (según estado)
  // - trial   -> trialEndAt
  // - active/past_due -> paidUntil
  // - otros   -> no aplica
  // -----------------------
  const dateLabel: string | null =
    status === "trial"
      ? "Trial hasta"
      : status === "active" || status === "past_due"
      ? "Pago hasta"
      : null;

  const relevantDate: string =
    status === "trial"
      ? formatTimestamptzHuman(trialEndAt)
      : status === "active" || status === "past_due"
      ? formatTimestamptzHuman(paidUntil)
      : "—";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Estado (badge) */}
      <InfoRow
        label="Estado"
        value={
          <span
            className={`
              inline-flex items-center px-3 py-1 rounded-full text-[13px] font-medium
              ${meta.badgeColorClass}
            `}
          >
            {meta.label}
          </span>
        }
      />

      {/* Fecha relevante (solo si aplica) */}
      {dateLabel && <InfoRow label={dateLabel} value={relevantDate} />}

      {/* Mensaje contextual (solo card) */}
      {meta.cardMessage ? (
        <InfoRow label="Información" value={meta.cardMessage} />
      ) : null}

      {/* Tester (solo card) */}
      {isTester ? (
        <InfoRow
          label="Acceso especial"
          value="Acceso extendido como tester interno."
        />
      ) : null}
    </div>
  );
}

/* -------------------------------------------
   Subcomponente: fila de información
   (mismo estilo que AccountInfoCard)
-------------------------------------------- */
function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div
      className="
        rounded-xl border border-white/10
        bg-slate-900/30
        px-4 py-3
        flex flex-col gap-1
      "
    >
      <span className="text-[11px] uppercase tracking-wide text-slate-300/80">
        {label}
      </span>
      <span className="text-sm font-medium text-slate-100">{value}</span>
    </div>
  );
}
