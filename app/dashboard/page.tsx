// src/app/dashboard/page.tsx
// Dashboard básico de Dinvox
// - Layout con sidebar + header + contenido
// - Sidebar con gradiente oscuro y cards tipo “vidrio” en el contenido
// - De momento usa datos mock (MVP sin conexión a Supabase)

"use client";

import Image from "next/image";
import {
  Home,
  Table2,
  PieChart,
  HelpCircle,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import { useState, type ReactNode } from "react";
// 🔹 Import para cerrar sesión con Supabase (server action)
import { logOut } from "@/lib/supabase/logout";
// 🔹 Import para redirigir después de cerrar sesión
import { useRouter } from "next/navigation";

// 🔹 Tipo de rol (a futuro lo podrás leer desde la sesión)
type Role = "user" | "admin";

// 🔹 Datos mock del usuario (solo para UI de prueba)
interface UserInfo {
  name: string;
  email: string;
  role: Role;
  planStatus: "trial" | "active" | "expired";
}

const MOCK_USER: UserInfo = {
  name: "Carlos Díaz",
  email: "carlos@example.com",
  role: "user",
  planStatus: "trial",
};

export default function DashboardPage() {
  const user = MOCK_USER;
  // 🔹 Router para redirigir después del logout
  const router = useRouter();
  // 🔹 Función que llama la server action logOut()
  const handleLogout = async () => {
    await logOut(); // Cierra sesión en Supabase
    router.replace("/login"); // Redirige al login
  };

  // Controla si el sidebar móvil está abierto
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    // 🧱 Layout raíz: gris suave, sin gradiente general
    <div className="min-h-screen flex bg-slate-100">
      {/* =============== SIDEBAR DESKTOP (FIJO) =============== */}
      <aside
        className="
          hidden md:flex flex-col w-64
          bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-900
          text-slate-100
        "
      >
        <SidebarContent
          user={user}
          showCloseButton={false}
          onCloseMobileSidebar={undefined}
          // 🔹 Le pasamos la función de logout al sidebar
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

          {/* Panel lateral con el mismo gradiente del sidebar desktop */}
          <div className="relative w-64 max-w-full h-full bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-900 text-slate-100 shadow-xl">
            <SidebarContent
              user={user}
              showCloseButton
              onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

      {/* =============== ZONA PRINCIPAL (HEADER + CONTENIDO) =============== */}
      <div className="flex-1 flex flex-col">
        {/* HEADER SUPERIOR */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Botón hamburguesa (solo móvil) */}
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Abrir menú lateral"
            >
              <Menu size={20} />
            </button>

            <div>
              <p className="text-xs sm:text-sm text-slate-500">Dashboard</p>
              <h1 className="text-base sm:text-lg font-semibold text-slate-900">
                Hola, {user.name.split(" ")[0]}
              </h1>
            </div>
          </div>

          {/* Avatar simple con inicial del usuario */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

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
                    <p className="text-xl font-semibold">\$ 0 COP</p>
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

/* ============================================================
   COMPONENTE: SidebarContent
   - Se usa tanto en desktop como en móvil (drawer)
   - Recibe el usuario, y opcionalmente botón de cierre en móvil
   ============================================================ */
interface SidebarContentProps {
  user: UserInfo;
  showCloseButton?: boolean;
  onCloseMobileSidebar?: () => void;
  // 🔹 Nueva prop para manejar logout desde el Dashboard
  onLogout?: () => void;
}

function SidebarContent({
  user,
  showCloseButton = false,
  onCloseMobileSidebar,
  onLogout,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* BLOQUE SUPERIOR: Branding Dinvox + botón cerrar en móvil */}
      <div className="h-16 flex items-center px-5 border-b border-white/10">
        {/* Logo redondo simple (usa el SVG de login) */}
        <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center mr-3">
           <Image
            src="/logo.svg"
            alt="Logo Dinvox"
            width={32}
            height={32}
            className="object-contain"
          />
        </div>

        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-wide">Dinvox</span>
          <span className="text-[11px] text-emerald-200/80">
            Asistente de gastos diarios
          </span>
        </div>

        {showCloseButton && onCloseMobileSidebar && (
          <button
            type="button"
            className="ml-auto inline-flex items-center justify-center rounded-md p-1 text-slate-200 hover:bg-slate-700/70 md:hidden"
            onClick={onCloseMobileSidebar}
            aria-label="Cerrar menú lateral"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* BLOQUE USUARIO + ESTADO DEL PLAN (TRIAL) */}
      <div className="px-5 py-4 border-b border-white/10">
        <p className="text-[11px] uppercase tracking-wide text-slate-300 mb-1">
          Usuario
        </p>
        <p className="text-sm font-medium truncate mb-2">{user.name}</p>

        {/* Badge “Trial” con efecto vidrio y elementos en blanco */}
        <div
          className="
            inline-flex items-center gap-2
            rounded-full border border-white/25
            bg-white/10 px-3 py-1
            backdrop-blur-md shadow-sm
          "
        >
          <span className="w-2.5 h-2.5 rounded-full border border-white/80" />
          <span className="text-[11px] font-medium text-slate-50">
            Trial
          </span>
        </div>
      </div>

      {/* BLOQUE NAVEGACIÓN PRINCIPAL */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Grupo: GASTOS */}
        <SidebarSectionLabel label="Gastos" />

        <SidebarItem label="Dashboard" active icon={<Home size={18} />} />
        <SidebarItem
          label="Tabla de registros"
          icon={<Table2 size={18} />}
        />
        <SidebarItem
          label="Análisis avanzado (próx.)"
          icon={<PieChart size={18} />}
          disabled
        />

        {/* Grupo: CUENTA */}
        <SidebarSectionLabel label="Cuenta" />

        <SidebarItem
          label="Configuración"
          icon={<Settings size={18} />}
        />
        <SidebarItem
          label="Ayuda / Cómo usar Dinvox"
          icon={<HelpCircle size={18} />}
        />
      </nav>

      {/* BLOQUE INFERIOR: Cerrar sesión */}
      <div className="p-4 border-t border-white/10">
        <button
          type="button"
          // 🔹 Evento: ejecutar logout cuando el usuario haga clic
          onClick={onLogout}
          className="
            w-full inline-flex items-center justify-center gap-2
            rounded-xl bg-white/10 px-3 py-2
            text-sm font-medium text-slate-50
            border border-white/15
            hover:bg-white/15 transition
          "
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENTE: SidebarItem
   - Representa una opción clickeable del menú lateral
   - Muestra icono + texto y maneja el estado “activo” / “disabled”
   ============================================================ */
interface SidebarItemProps {
  label: string;
  active?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
}

function SidebarItem({
  label,
  active = false,
  icon,
  disabled = false,
}: SidebarItemProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`
        w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition
        ${
          active
            ? "bg-white/15 text-slate-50 shadow-sm"
            : "text-slate-200/80 hover:bg-white/10 hover:text-white"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="truncate">{label}</span>
    </button>
  );
}

/* ============================================================
   COMPONENTE: SidebarSectionLabel
   - Pequeño título para agrupar ítems del sidebar
   ============================================================ */
function SidebarSectionLabel({ label }: { label: string }) {
  return (
    <p className="mt-2 mb-1 text-[11px] uppercase tracking-wide text-slate-400 px-2">
      {label}
    </p>
  );
}
