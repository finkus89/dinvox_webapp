// src/app/(app)/layout.tsx
// ------------------------------------------------------------
// Layout autenticado (grupo (app)).
//
// Fuente de verdad:
// - NO lee users ni user_subscription_state directamente.
// - Llama 1 vez a la RPC: get_user_context_by_channel_id(...)
//   usando p_auth_user_id.
//   OJO: por firma actual, Supabase exige pasar también
//   p_channel y p_provider_chat_id (aunque no se usen).
//
// Beneficio:
// - La UI recibe sub_status + can_use validados por fechas.
// - Evita inconsistencias entre n8n y la web.
// ------------------------------------------------------------

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

import Header from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import PageContainer from "@/components/layout/PageContainer";

import { createClient } from "@/lib/supabase/browser";
import { logOut } from "@/lib/supabase/logout";
import { AppContext } from "@/lib/dinvox/app-context";

import type { SubscriptionStatus } from "@/lib/dinvox/subscription-meta";

// -----------------------
// Helpers
// -----------------------
function formatName(raw: string): string {
  return raw
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getTitleFromPath(pathname: string) {
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/expenses")) return "Tabla de Gastos";
  if (pathname.startsWith("/performance")) return "Desempeño";
  if (pathname.startsWith("/help")) return "Ayuda / Cómo usar Dinvox";
  if (pathname.startsWith("/settings")) return "Configuración";
  return "Dinvox";
}

function isSubscriptionStatus(x: any): x is SubscriptionStatus {
  return (
    x === "free" ||
    x === "trial" ||
    x === "active" ||
    x === "past_due" ||
    x === "blocked" ||
    x === "unknown"
  );
}

// -----------------------
// Shape RPC (solo lo que consumimos en UI)
// -----------------------
type RpcUserContext = {
  // ✅ NUEVO (agregado a la RPC)
  name: string | null;

  // users
  user_id: string;
  auth_user_id: string;
  channel: "telegram" | "whatsapp" | null;
  telegram_chat_id: string | null;
  wa_id: string | null;
  currency: string | null;
  language: string | null;
  timezone: string | null;

  // subscription
  sub_status: string | null;
  plan_code: string | null;
  trial_end_at: string | null;
  paid_until: string | null;
  is_tester: boolean | null;

  // autorizaciones
  can_use: boolean | null;
  can_use_reason: string | null;
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();

  const [ctx, setCtx] = useState<RpcUserContext | null>(null);
  const [loading, setLoading] = useState(true);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // -----------------------
  // Carga global desde RPC
  // -----------------------
  useEffect(() => {
    let cancelled = false;

    async function loadAppContext() {
      setLoading(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          if (!cancelled) setLoading(false);
          return;
        }

        const authUserId = session.user.id;

        // ✅ IMPORTANTE:
        // La firma actual exige p_channel y p_provider_chat_id (text, text, uuid)
        // Aunque con p_auth_user_id no se usen, hay que enviarlos para que RPC no falle.
        const { data, error } = await supabase.rpc("get_user_context_by_channel_id", {
          p_channel: "telegram",
          p_provider_chat_id: "",
          p_auth_user_id: authUserId,
        });

        if (cancelled) return;

        if (error) {
          console.error("RPC get_user_context_by_channel_id error:", error);
          setCtx(null);
          return;
        }

        // Normaliza: a veces viene array (según cliente/config)
        const row = Array.isArray(data) ? data[0] : data;
        setCtx((row ?? null) as RpcUserContext);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAppContext();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // Logout centralizado
  const handleLogout = async () => {
    await logOut();
    router.replace("/login");
  };

  // -----------------------
  // Derivados seguros
  // -----------------------
  const rawName = ctx?.name ?? "";
  const displayName = rawName ? formatName(rawName) : "";

  const language = ctx?.language ?? "es-CO";
  const currency = ctx?.currency ?? "COP";
  const channel = ctx?.channel ?? "telegram";
  const timezone = ctx?.timezone ?? "America/Bogota";

  const subscriptionStatus: SubscriptionStatus = isSubscriptionStatus(ctx?.sub_status)
    ? (ctx!.sub_status as SubscriptionStatus)
    : "unknown";

  const planCode = ctx?.plan_code ?? "basic";
  const trialEndAt = ctx?.trial_end_at ?? null;
  const paidUntil = ctx?.paid_until ?? null;
  const isTester = ctx?.is_tester ?? false;

  // ✅ Autoridad de escritura (ya validado por fechas en DB)
  const canUse = ctx?.can_use ?? false;
  const canUseReason = ctx?.can_use_reason ?? null;

  const languageDisplay = language.toUpperCase();
  const currencyDisplay = currency.toUpperCase();

  // Banner trial (solo informativo; autoridad real = canUse)
  const trialDaysLeft = useMemo(() => {
    if (subscriptionStatus !== "trial") return null;
    if (!trialEndAt) return null;

    const end = new Date(trialEndAt).getTime();
    const now = Date.now();
    const msLeft = end - now;

    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  }, [subscriptionStatus, trialEndAt]);

  const shouldShowTrialBanner =
    subscriptionStatus === "trial" &&
    trialDaysLeft !== null &&
    trialDaysLeft <= 4 &&
    trialDaysLeft > 0;

    // ------------------------------------------------------------
    // Banner modo solo lectura
    // - Autoridad real: canUse (validado por RPC en DB)
    // - Se muestra cuando el usuario NO puede mutar datos
    // ------------------------------------------------------------
  const shouldShowReadOnlyBanner = !loading && !canUse;

  // ==========================================================
  // ✅ Provider debe envolver TODO lo que consuma AppContext
  // (Sidebar + Header + children)
  // ==========================================================
  return (
    <AppContext.Provider
      value={{
        name: rawName,
        currency,
        language,
        channel,
        timezone,

        subscriptionStatus,
        planCode,
        trialEndAt,
        paidUntil,
        isTester,

        canUse,
        canUseReason,
      }}
    >
      <div className="h-screen flex bg-slate-100 overflow-hidden">
        {/* =============== SIDEBAR DESKTOP =============== */}
        <aside
          className="
            hidden md:flex flex-col w-64
            bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-900
            text-slate-100
            h-full
          "
        >
          <Sidebar
            userName={displayName}
            showCloseButton={false}
            onCloseMobileSidebar={undefined}
            onLogout={handleLogout}
          />
        </aside>

        {/* =============== SIDEBAR MÓVIL =============== */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <button
              type="button"
              className="flex-1 bg-black/40"
              onClick={() => setIsMobileSidebarOpen(false)}
              aria-label="Cerrar menú lateral"
            />
            <div className="relative w-64 max-w-full h-full bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-900 text-slate-100 shadow-xl">
              <Sidebar
                userName={displayName}
                showCloseButton
                onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
                onLogout={handleLogout}
              />
            </div>
          </div>
        )}

        {/* =============== ZONA PRINCIPAL =============== */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <Header
            displayName={displayName}
            language={languageDisplay}
            currency={currencyDisplay}
            onOpenSidebar={() => setIsMobileSidebarOpen(true)}
            title={getTitleFromPath(pathname)}
          />
            {/* =============== banner trial =============== */}
          {shouldShowTrialBanner && (
            <div className="px-4 md:px-6 pt-4">
              <div className="rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Te quedan <b>{trialDaysLeft}</b>{" "}
                {trialDaysLeft === 1 ? "día" : "días"} de trial.
              </div>
            </div>
          )}

          {/* =============== banner suscripcionvencida o trial vencido =============== */}
          {shouldShowReadOnlyBanner && (
            <div className="px-4 md:px-6 pt-4">
              <div
                className="
                  rounded-xl
                  border border-red-400/60
                  bg-red-100
                  px-5 py-4
                  text-sm
                  text-red-900
                  shadow-sm
                "
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-red-600">
                    ⚠️
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold text-red-800">
                      Modo solo lectura
                    </p>
                    <p className="mt-1 text-red-800/90">
                      Puedes ver tus gráficos y registros, pero no puedes crear,
                      editar ni eliminar gastos.
                    </p>
                    <button
                      onClick={() => router.push("/settings")}
                      className="mt-2 text-sm font-medium underline hover:no-underline"
                    >
                      Revisar suscripción
                    </button>
                  </div>
                </div>
              </div>
            </div>

          )}
 

          <PageContainer>
            {loading ? (
              <div className="text-sm text-slate-500">Cargando…</div>
            ) : (
              children
            )}
          </PageContainer>
        </div>
      </div>
    </AppContext.Provider>
  );
}
