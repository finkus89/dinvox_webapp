// src/app/settings/page.tsx
// Página de configuración del usuario Dinvox
// - Lee datos reales desde Supabase (tabla users)
// - Mapea país desde countries-config
// - Formatea fecha de registro a formato humano
// - Renderiza la card "Tu cuenta" en modo solo lectura
// - Usa layout base (Header + Sidebar + PageContainer).
// - Organiza las secciones como accordion (una abierta a la vez).
// - "Tu cuenta" abierta por defecto.

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { logOut } from "@/lib/supabase/logout";
import { useRouter } from "next/navigation";
import { User, Trash2 } from "lucide-react";
import Header from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import PageContainer from "@/components/layout/PageContainer";
import AccountInfoCard from "@/components/settings/AccountInfoCard";
import { SettingsAccordion } from "@/components/settings/SettingsAccordion";
import SettingsSection from "@/components/settings/SettingsSection";
import DeleteAccountCard from "@/components/settings/DeleteAccountCard";

// 🔹 Helpers existentes
import { formatDateISO, formatDateHuman } from "@/lib/dinvox/periods";
// 🔹 Configuración de países
import { COUNTRY_LIST } from "@/lib/dinvox/countries-config";

// 🔹 Estructura real de la tabla users (campos que necesitamos)
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


// 🔹 Helper para formatear nombre en Title Case
function formatName(raw: string): string {
  return raw
    .trim()
    .split(" ")
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join(" ");
}

export default function SettingsPage() {
  const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // 🔹 Carga de datos reales del usuario desde Supabase
  useEffect(() => {
    async function loadUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const { data, error } = await supabase
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
        .eq("auth_user_id", session.user.id)
        .single();

      if (!error && data) {
        setDbUser(data);
      }
    }

    loadUser();
  }, [supabase]);

  // 🔹 Logout
  const handleLogout = async () => {
    await logOut();
    router.replace("/login");
  };

  // ===============================
  // 🔹 Transformación de datos para la UI
  // ===============================

  const displayName = dbUser?.name
    ? formatName(dbUser.name)
    : "";

  const email = dbUser?.email ?? "—";

  // Teléfono: usamos E.164 si existe
  const phone = dbUser?.phone_e164 ?? "No registrado";

  // Canal (por ahora solo Telegram)
  const channelDisplay = dbUser?.channel ?? "—";


  const languageDisplay = dbUser?.language?.toUpperCase() ?? "—";
  const currencyDisplay = dbUser?.currency?.toUpperCase() ?? "—";

  // 🔹 País: se resuelve desde el código telefónico usando countries-config
  const countryDisplay = (() => {
    if (!dbUser?.phone_country_code) return "—";

    const match = COUNTRY_LIST.find(
      (c) => c.dialCode === dbUser.phone_country_code
    );

    return match?.name ?? "—";
  })();

  // 🔹 Fecha de registro en formato humano
  const createdAtDisplay = (() => {
    if (!dbUser?.created_at) return "—";

    const date = new Date(dbUser.created_at);
    const iso = formatDateISO(date); // YYYY-MM-DD
    return formatDateHuman(iso);
  })();

  return (
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
          <div className="relative w-64 h-full bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-900 text-slate-100 shadow-xl">
            <Sidebar
              userName={displayName}
              showCloseButton
              onCloseMobileSidebar={() =>
                setIsMobileSidebarOpen(false)
              }
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
          title="Configuración"
        />

        {/* CONTENIDO */}
        <PageContainer>
        <SettingsAccordion defaultOpenKey="account">
          <SettingsSection 
            sectionKey="account"
            title="Tu cuenta" 
            icon={<User className="h-5 w-5 text-slate-200" />}
          >
            <AccountInfoCard
              name={displayName}
              email={email}
              phone={phone}
              channel={channelDisplay}
              language={languageDisplay}
              currency={currencyDisplay}
              country={countryDisplay}
              createdAt={createdAtDisplay}
            />
          </SettingsSection>

          <SettingsSection 
            sectionKey="delete" 
            title="Eliminar cuenta" 
            icon={<Trash2 className="h-5 w-5 text-red-300" />}
          >
            <DeleteAccountCard />
          </SettingsSection>
        </SettingsAccordion>
      </PageContainer>

      </div>
    </div>
  );
}
