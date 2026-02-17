// src/app/(app)/settings/page.tsx
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
  pending_channel: string | null;
  language: string;
  currency: string;
  created_at: string;
}

interface DBSubscription {
  status: SubscriptionStatus;
  trial_end_at: string | null;
  paid_until: string | null;
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

export default function SettingsPage() {
  const supabase = createClient();

  const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const [subscription, setSubscription] = useState<DBSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Para forzar recarga cuando cancelas pending
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (isMounted) setLoading(false);
        return;
      }

      const authUserId = session.user.id;

      // 1) Users
      const { data: userData } = await supabase
        .from("users")
        .select(
          `
          name,
          email,
          phone_country_code,
          phone_e164,
          channel,
          pending_channel,
          language,
          currency,
          created_at
        `
        )
        .eq("auth_user_id", authUserId)
        .single();

      if (isMounted) {
        if (userData) setDbUser(userData as DBUser);
      }

      // 2) Subscription
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

      if (isMounted) {
        if (subData) {
          setSubscription({
            status: (subData.status as SubscriptionStatus) ?? "trial",
            trial_end_at: subData.trial_end_at ?? null,
            paid_until: subData.paid_until ?? null,
            is_tester: Boolean(subData.is_tester),
          });
        } else {
          setSubscription(null);
        }

        setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [supabase, refreshKey]);

  // ✅ handler real: llama endpoint y fuerza refresh
  async function cancelPendingChannelChange() {
  const res = await fetch("/api/settings/cancel-channel-change", {
    method: "POST",
  });

  console.log("cancel-channel-change status:", res.status);

  const raw = await res.text();
  console.log("cancel-channel-change raw response:", raw);

  // Si sí es JSON, lo mostramos parseado
  try {
    const json = JSON.parse(raw);
    console.log("cancel-channel-change parsed:", json);

    if (!res.ok || !json?.ok) {
      console.error("Cancel pending failed:", json);
      return;
    }

    setRefreshKey((k) => k + 1);
  } catch {
    // Si NO es JSON, aquí queda clarísimo el problema (HTML, vacío, etc.)
    console.error("Cancel pending failed: response is not JSON");
  }
}


  if (loading) {
    return <div className="text-sm text-slate-400">Cargando configuración…</div>;
  }

  // Transformaciones UI
  const displayName = dbUser?.name ? formatName(dbUser.name) : "—";
  const email = dbUser?.email ?? "—";
  const phone = dbUser?.phone_e164 ?? "No registrado";
  const channel = dbUser?.channel ?? "—";
  const pendingChannel = dbUser?.pending_channel ?? null;

  const language = dbUser?.language?.toUpperCase() ?? "—";
  const currency = dbUser?.currency?.toUpperCase() ?? "—";

  const country = (() => {
    if (!dbUser?.phone_country_code) return "—";
    const match = COUNTRY_LIST.find((c) => c.dialCode === dbUser.phone_country_code);
    return match?.name ?? "—";
  })();

  const createdAt = dbUser?.created_at ? formatHumanDate(dbUser.created_at) : "—";

  const trialEndAtRaw = subscription?.trial_end_at ?? null;
  const paidUntilRaw = subscription?.paid_until ?? null;

  return (
    <div className="text-slate-100">
      <Accordion defaultOpenKey="account">
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
            pendingChannel={pendingChannel}
            language={language}
            currency={currency}
            country={country}
            createdAt={createdAt}
            onCancelPending={cancelPendingChannelChange} // ✅ NUEVO
          />
        </AccordionSection>

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
