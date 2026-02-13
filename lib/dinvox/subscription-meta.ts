// src/lib/dinvox/subscription-meta.ts
// ------------------------------------------------------------
// Helper centralizado para manejar metadata de suscripción.
// Se usa en:
// - Sidebar (solo label + color)
// - SubscriptionInfoCard (label + color + mensaje contextual + tester)
//
// IMPORTANTE:
// - El mensaje contextual NO incluye fechas.
// - Tester es secundario y solo visible en la card.
//
// 🆕 NOTA (consistencia con RPC):
// - El campo `status` (free/trial/active/...) puede quedar “desalineado”
//   si en BD no se actualizó aún, o si las fechas ya vencieron.
// - La autoridad final para permitir uso es `canUse` (calculado por la RPC).
// - Para UI, necesitamos un “estado visual” consistente:
//      • Si status dice "active"/"trial" pero canUse=false -> NO debe verse verde/amber.
//      • En esos casos hacemos override a "Vencido" (o "Trial vencido").
// ------------------------------------------------------------

export type SubscriptionStatus =
  | "free"
  | "trial"
  | "active"
  | "past_due"
  | "blocked"
  | "unknown";

// Motivos que ya devuelve la RPC (extendible)
export type CanUseReason =
  | "no_auth_user_id"
  | "no_subscription_row"
  | "tester"
  | "active_but_expired"
  | "trial_expired"
  | "past_due"
  | "blocked"
  | "free"
  | "active_ok"
  | "trial_ok"
  | "unknown";

export type SubscriptionMeta = {
  label: string;            // Texto visible (una sola palabra)
  badgeColorClass: string;  // Clases Tailwind para color
  cardMessage: string;      // Mensaje contextual (solo card)
};

// ------------------------------------------------------------
// Función principal
// ------------------------------------------------------------
// 🆕 Firma nueva:
// - status: lo que dice la BD / estado nominal
// - canUse: autoridad final (calculada en RPC por fechas + tester)
// - canUseReason (opcional): permite mensajes más precisos ("Trial vencido", etc.)
export function getSubscriptionMeta(
  status: SubscriptionStatus,
  canUse: boolean,
  canUseReason?: CanUseReason | string | null
): SubscriptionMeta {
  // ----------------------------------------------------------
  // OVERRIDE por autoridad (RPC)
  // ----------------------------------------------------------
  // Caso real detectado:
  // - status = "active" o "trial"
  // - pero paid_until/trial_end_at ya vencieron
  // - RPC devuelve canUse=false
  //
  // En UI no debe verse "Activo" (verde) ni "Trial" (amber).
  // Mostramos estado vencido con mensaje más preciso si se puede.
  if (!canUse && (status === "active" || status === "trial")) {
    // Mensajes finos según reason (si viene)
    if (canUseReason === "trial_expired") {
      return {
        label: "Vencido",
        badgeColorClass: "bg-red-500/15 text-red-400 border border-red-400/30",
        cardMessage: "Tu periodo de prueba ha terminado.",
      };
    }

    if (canUseReason === "active_but_expired") {
      return {
        label: "Vencido",
        badgeColorClass: "bg-red-500/15 text-red-400 border border-red-400/30",
        cardMessage: "Tu suscripción está activa, pero el pago está vencido.",
      };
    }

    // Fallback: si no sabemos el motivo exacto, igual marcamos vencido
    return {
      label: "Vencido",
      badgeColorClass: "bg-red-500/15 text-red-400 border border-red-400/30",
      cardMessage: "Tu acceso está vencido.",
    };
  }

  // ----------------------------------------------------------
  // Estado nominal (cuando canUse no obliga override)
  // ----------------------------------------------------------
  switch (status) {
    case "free":
      return {
        label: "Gratis",
        badgeColorClass: "bg-white/10 text-white border border-white/20",
        cardMessage: "Estás usando el plan gratuito.",
      };

    case "trial":
      return {
        label: "Trial",
        badgeColorClass:
          "bg-amber-500/15 text-amber-400 border border-amber-400/30",
        cardMessage: "Tu cuenta está en periodo de prueba.",
      };

    case "active":
      return {
        label: "Activo",
        badgeColorClass:
          "bg-emerald-500/15 text-emerald-400 border border-emerald-400/30",
        cardMessage: "Tu suscripción está activa.",
      };

    case "past_due":
      return {
        label: "Vencido",
        badgeColorClass: "bg-red-500/15 text-red-400 border border-red-400/30",
        cardMessage: "Tu suscripción ha vencido.",
      };

    case "blocked":
      return {
        label: "Bloqueada",
        badgeColorClass: "bg-red-600/20 text-red-400 border border-red-500/40",
        cardMessage: "Tu cuenta está bloqueada.",
      };

    default:
      return {
        label: "—",
        badgeColorClass: "bg-white/10 text-white border border-white/20",
        cardMessage: "",
      };
  }
}
