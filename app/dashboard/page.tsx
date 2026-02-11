// src/app/dashboard/page.tsx
// Dashboard básico de Dinvox (con Header + Sidebar como componentes)

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { logOut } from "@/lib/supabase/logout";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import PageContainer from "@/components/layout/PageContainer";
import SummaryCard from "@/components/dashboard/SummaryCard";

// 🔹 Datos reales del usuario desde la BD
interface DBUser {
  name: string;
  currency: string;
  language: string;
}

// 🔹 Helper para formatear el nombre en “Title Case”
function formatName(raw: string): string {
  return raw
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export default function DashboardPage() {
  const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // 🔹 Carga de usuario desde Supabase
  useEffect(() => {
    async function loadUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("users")
        .select("name, currency, language")
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

  // 🔹 Nombre e info para header/sidebar
  const rawName = dbUser?.name ?? "";
  const displayName = rawName ? formatName(rawName) : "";
  // Comentario: si en la BD ya guardas "es-co", aquí simplemente lo mostramos
  const languageDisplay = (dbUser?.language ?? "es-co").toUpperCase();
  const currencyDisplay = (dbUser?.currency ?? "COP").toUpperCase();

  // 🆕 Valores “source of truth” para formateo de dinero en cards (desde BD)
  const language = dbUser?.language ?? "es-CO";
  const currency = dbUser?.currency ?? "COP";

  return (
    <div className="h-screen flex bg-slate-100 overflow-hidden">
      {/* =============== SIDEBAR DESKTOP (FIJO) =============== */}
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

      {/* =============== SIDEBAR MÓVIL (DRAWER) =============== */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* Fondo semitransparente para cerrar al hacer clic fuera */}
          <button
            type="button"
            className="flex-1 bg-black/40"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Cerrar menú lateral"
          />
          {/* Panel lateral móvil */}
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

      {/* =============== ZONA PRINCIPAL (HEADER + CONTENIDO) =============== */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* HEADER reutilizable */}
        <Header
          displayName={displayName}
          language={languageDisplay}
          currency={currencyDisplay}
          onOpenSidebar={() => setIsMobileSidebarOpen(true)}
          title="Dashboard"
        />

        {/* CONTENIDO PRINCIPAL usando PageContainer */}
        <PageContainer>
          {/* Tarjeta 1: Resumen (dona + categorias) */}
          <SummaryCard
            fallbackCurrency={currency} // 🆕 currency real desde BD
            fallbackLanguage={language} // 🆕 language real desde BD (ej: es-CO, es-ES)
          />
        </PageContainer>
      </div>
    </div>
  );
}
