// src/app/(app)/settings/page.tsx
// ------------------------------------------------------------
// SettingsPage (refactor final)
// ------------------------------------------------------------
// Qué hace:
// - NO renderiza layout propio (usa AppLayout global)
// - Trae datos extendidos del usuario desde Supabase:
//      • users (info básica)
//      • user_subscription_state (estado real suscripción)
// - Pasa datos limpios a:
//      • AccountInfoCard
//      • SubscriptionInfoCard
// - Importante:
//      • Las fechas de suscripción se pasan CRUDAS (timestamptz ISO) a la card.
//        La card es la responsable de formatearlas.
// ------------------------------------------------------------

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { User, CreditCard, Trash2 } from "lucide-react";

import AccountInfoCard from "@/components/settings/AccountInfoCard";
import SubscriptionInfoCard from "@/components/settings/SubscriptionInfoCard";
import DeleteAccountCard from "@/components/settings/DeleteAccountCard";

import { Accordion } from "@/components/layout/Accordion";
import AccordionSection from "@/components/layout/AccordionSection";

import { formatDateISO, formatDateHuman } from "@/lib/dinvox/periods";
import { COUNTRY_LIST } from "@/lib/dinvox/countries-config";
import type { SubscriptionStatus } from "@/lib/dinvox/subscription-meta";

// -----------------------
// Tipos BD
// -----------------------
interface DBUser {
  name: string | null;
  email: string | null;
  phone_country_code: string | null;
  phone_e164: string | null;
  channel: string;
  language: string;
  currency: string;
  created_at: string;
}

interface DBSubscription {
  status: SubscriptionStatus;
  trial_end_at: string | null; // ISO (timestamptz) crudo
  paid_until: string | null;   // ISO (timestamptz) crudo
  is_tester: boolean;
}

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

function formatHumanDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  const iso = formatDateISO(date);
  return formatDateHuman(iso);
}

// -----------------------
// Component
// -----------------------
export default function SettingsPage() {
  const supabase = createClient();

  const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const [subscription, setSubscription] = useState<DBSubscription | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      const authUserId = session.user.id;

      // ===============================
      // 1️⃣ Users
      // ===============================
      const { data: userData } = await supabase
        .from("users")
        .select(
          `
          name,
          email,
          phone_country_code,
          phone_e164,
          channel,
          language,
          currency,
          created_at
        `
        )
        .eq("auth_user_id", authUserId)
        .single();

      if (userData) setDbUser(userData as DBUser);

      // ===============================
      // 2️⃣ Subscription
      // ===============================
      const { data: subData } = await supabase
        .from("user_subscription_state")
        .select(
          `
          status,
          trial_end_at,
          paid_until,
          is_tester
        `
        )
        .eq("auth_user_id", authUserId)
        .maybeSingle();

      if (subData) {
        setSubscription({
          status: (subData.status as SubscriptionStatus) ?? "trial",
          trial_end_at: subData.trial_end_at ?? null,
          paid_until: subData.paid_until ?? null,
          is_tester: Boolean(subData.is_tester),
        });
      } else {
        // Si no existe fila aún, dejamos null (UI decide qué mostrar)
        setSubscription(null);
      }

      setLoading(false);
    }

    loadData();

    return () => controller.abort();
  }, [supabase]);

  if (loading) {
    return <div className="text-sm text-slate-400">Cargando configuración…</div>;
  }

  // ===============================
  // Transformaciones UI (solo users)
  // ===============================
  const displayName = dbUser?.name ? formatName(dbUser.name) : "—";
  const email = dbUser?.email ?? "—";
  const phone = dbUser?.phone_e164 ?? "No registrado";
  const channel = dbUser?.channel ?? "—";
  const language = dbUser?.language?.toUpperCase() ?? "—";
  const currency = dbUser?.currency?.toUpperCase() ?? "—";

  const country = (() => {
    if (!dbUser?.phone_country_code) return "—";
    const match = COUNTRY_LIST.find((c) => c.dialCode === dbUser.phone_country_code);
    return match?.name ?? "—";
  })();

  const createdAt = dbUser?.created_at ? formatHumanDate(dbUser.created_at) : "—";

  // ✅ IMPORTANTE:
  // Fechas de suscripción se pasan CRUDAS (ISO timestamptz) a la card.
  // NO se formatean aquí.
  const trialEndAtRaw = subscription?.trial_end_at ?? null;
  const paidUntilRaw = subscription?.paid_until ?? null;

  return (
    <div className="text-slate-100">
      <Accordion defaultOpenKey="account">
        {/* ========================= */}
        {/* TU CUENTA */}
        {/* ========================= */}
        <AccordionSection
          sectionKey="account"
          title="Tu cuenta"
          icon={<User className="h-5 w-5 text-slate-200" />}
        >
          <AccountInfoCard
            name={displayName}
            email={email}
            phone={phone}
            channel={channel}
            language={language}
            currency={currency}
            country={country}
            createdAt={createdAt}
          />
        </AccordionSection>

        {/* ========================= */}
        {/* SUSCRIPCIÓN */}
        {/* ========================= */}
        <AccordionSection
          sectionKey="subscription"
          title="Suscripción"
          icon={<CreditCard className="h-5 w-5 text-slate-200" />}
        >
          {subscription ? (
            <SubscriptionInfoCard
              status={subscription.status}
              isTester={subscription.is_tester}
              trialEndAt={trialEndAtRaw}
              paidUntil={paidUntilRaw}
            />
          ) : (
            <div className="text-sm text-white/70">
              No hay información de suscripción disponible aún.
            </div>
          )}
        </AccordionSection>

        {/* ========================= */}
        {/* ELIMINAR CUENTA */}
        {/* ========================= */}
        <AccordionSection
          sectionKey="delete"
          title="Eliminar cuenta"
          icon={<Trash2 className="h-5 w-5 text-red-300" />}
        >
          <DeleteAccountCard />
        </AccordionSection>
      </Accordion>
    </div>
  );
}
