// src/app/dashboard/page.tsx
// Dashboard básico de Dinvox (con Header + Sidebar como componentes)

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { logOut } from "@/lib/supabase/logout";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

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
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
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
  const displayName = formatName(dbUser?.name ?? "Usuario");
  // Comentario: si en la BD ya guardas "es-co", aquí simplemente lo mostramos
  const languageDisplay = (dbUser?.language ?? "es-co").toUpperCase();
  const currencyDisplay = (dbUser?.currency ?? "COP").toUpperCase();

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* =============== SIDEBAR DESKTOP (FIJO) =============== */}
      <aside
        className="
          hidden md:flex flex-col w-64
          bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-900
          text-slate-100
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
      <div className="flex-1 flex flex-col">
        {/* HEADER reutilizable */}
        <Header
          displayName={displayName}
          language={languageDisplay}
          currency={currencyDisplay}
          onOpenSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 bg-slate-100 px-4 sm:px-6 py-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* ==== BLOQUE 1: RESUMEN RÁPIDO / GRAFICO PRINCIPAL ==== */}
            <section
              className="
                rounded-3xl border border-white/10
                bg-slate-900/70 backdrop-blur-xl shadow-xl
                text-slate-100 p-6 sm:p-8
              "
            >
              <h2 className="text-lg font-semibold mb-1">
                Resumen rápido (MVP)
              </h2>
              <p className="text-sm text-slate-300 mb-6 max-w-3xl">
                Aquí luego mostraremos tu gráfica principal de gastos (dona,
                filtros por fecha, totales por categoría, etc.). Por ahora solo
                es un placeholder visual para validar el layout.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Placeholder para la dona */}
                <div className="lg:col-span-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 h-48 sm:h-56 md:h-64 flex items-center justify-center text-sm text-slate-400">
                    [Dona de gastos por categoría]
                  </div>
                </div>

                {/* Mini tarjetas a la derecha */}
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <p className="text-xs text-slate-400 mb-1">
                      TOTAL FILTRADO
                    </p>
                    <p className="text-xl font-semibold">\$ 0 {currencyDisplay}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <p className="text-xs text-slate-400 mb-1">
                      CATEGORÍAS ACTIVAS
                    </p>
                    <p className="text-lg font-semibold">—</p>
                  </div>
                </div>
              </div>
            </section>

            {/* ==== BLOQUE 2: PRÓXIMA SECCIÓN (TABLA REGISTROS) ==== */}
            <section
              className="
                rounded-3xl border border-white/10
                bg-slate-900/70 backdrop-blur-xl shadow-xl
                text-slate-100 p-6 sm:p-8
              "
            >
              <h3 className="text-base font-semibold mb-2">
                Próxima sección: tabla de registros
              </h3>
              <p className="text-sm text-slate-300 max-w-3xl">
                Aquí luego irá la tabla editable de gastos (categoría, monto,
                nota, fecha) con buscador, filtros y acciones para corregir
                registros. De momento solo usamos este bloque para validar el
                layout y estilo del dashboard.
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
