"use client";

import { createContext, useContext } from "react";
import type { SubscriptionStatus } from "@/lib/dinvox/subscription-meta";

/**
 * Dinvox | AppContext
 * ------------------------------------------------------------
 * Contexto global (NO hace fetch).
 * El layout (AppLayout) llama la RPC y llena este Provider.
 *
 * Objetivo:
 * - Centralizar datos compartidos (perfil + suscripción + permisos).
 * - Evitar duplicar fetch en cada página.
 */

export type AppContextType = {
  // PERFIL
  name: string;
  currency: string;
  language: string;
  channel: "telegram" | "whatsapp";
  timezone: string;

  // SUSCRIPCIÓN
  subscriptionStatus: SubscriptionStatus;
  planCode: string;
  trialEndAt: string | null;
  paidUntil: string | null;
  isTester: boolean;

  // AUTORIZACIÓN
  canUse: boolean;
  canUseReason: string | null;
};

export const AppContext = createContext<AppContextType>({
  name: "",
  currency: "COP",
  language: "es-CO",
  channel: "telegram",
  timezone: "America/Bogota",

  subscriptionStatus: "unknown",
  planCode: "basic",
  trialEndAt: null,
  paidUntil: null,
  isTester: false,

  // ✅ más seguro: mientras carga, NO asumir permisos
  canUse: false,
  canUseReason: null,
});

export function useAppContext() {
  return useContext(AppContext);
}
