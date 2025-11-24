// src/app/dashboard/page.tsx
// Dashboard básico de Dinvox (solo UI, sin lógica real todavía)

"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

// Íconos de lucide-react (solo los que vamos a usar)
import {
  PieChart,
  Table,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
} from "lucide-react";

// ────────────────────────────────────────
// Tipos y datos mock (solo para UI)
// ────────────────────────────────────────

type UserPlan = "trial" | "active";

interface UserInfo {
  name: string;
  email: string;
  plan: UserPlan; // estado simple de la cuenta
}

// ⚠️ Por ahora datos de prueba.
// Luego esto vendrá de Supabase / sesión.
const MOCK_USER: UserInfo = {
  name: "Carlos Díaz",
  email: "carlos@example.com",
  plan: "trial",
};

// ────────────────────────────────────────
// Componente principal del dashboard
// ────────────────────────────────────────

export default function DashboardPage() {
  const user = MOCK_USER;

  // Controla si el sidebar móvil (drawer) está abierto o cerrado
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    // Fondo general con el mismo gradiente que login / register
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900">
      {/* =============== SIDEBAR DESKTOP (FIJO) =============== */}
      <aside className="hidden md:flex flex-col w-64 text-slate-100">
        <SidebarContent user={user} />
      </aside>

      {/* =============== SIDEBAR MÓVIL (DRAWER) =============== */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* Fondo oscuro clickeable para cerrar */}
          <button
            type="button"
            className="flex-1 bg-black/40"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Cerrar menú lateral"
          />

          {/* Panel lateral móvil con el mismo gradiente */}
          <div className="relative w-64 max-w-full h-full bg-gradient-to-b from-slate-900 via-slate-800 to-brand-900 text-slate-100 shadow-xl">
            <SidebarContent
              user={user}
              showCloseButton
              onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* =============== ZONA PRINCIPAL (HEADER + CONTENIDO) =============== */}
      <div className="flex-1 flex flex-col">
        {/* HEADER SUPERIOR (lo dejamos claro para contraste) */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-white/95 border-b border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Botón hamburguesa solo en móvil */}
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Abrir menú lateral"
            >
              <Menu size={20} />
            </button>

            <div>
              <p className="text-sm text-slate-500">Dashboard</p>
              <h1 className="text-lg font-semibold text-slate-900">
                Hola, {user.name.split(" ")[0]}
              </h1>
            </div>
          </div>

          {/* Avatar simple con inicial del usuario */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 px-4 sm:px-6 py-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* ─────────────────────────────────── */}
            {/* CARD PRINCIPAL (glassmorphism)     */}
            {/* ─────────────────────────────────── */}
            <section
              className="
                rounded-2xl
                border border-white/15
                bg-white/10
                backdrop-blur-xl
                shadow-xl shadow-black/25
                p-6
                text-slate-50
              "
            >
              <h2 className="text-base font-semibold mb-1">
                Resumen rápido (MVP)
              </h2>
              <p className="text-sm text-slate-200/80 mb-4">
                Aquí luego mostraremos tu gráfica principal de gastos (dona,
                filtros por fecha, totales por categoría, etc.). Por ahora solo
                es un placeholder visual.
              </p>

              {/* Placeholder de la futura dona */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 flex items-center justify-center rounded-2xl border border-white/10 bg-slate-900/20">
                  <span className="text-sm text-slate-200/80">
                    [Dona de gastos por categoría]
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="rounded-xl border border-white/10 bg-slate-900/30 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-300">
                      Total filtrado
                    </p>
                    <p className="text-lg font-semibold text-slate-50">
                      $ 0 COP
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-900/30 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-300">
                      Categorías activas
                    </p>
                    <p className="text-sm font-medium text-slate-50">—</p>
                  </div>
                </div>
              </div>
            </section>

            {/* ─────────────────────────────────── */}
            {/* SEGUNDA CARD: tabla / análisis WIP  */}
            {/* ─────────────────────────────────── */}
            <section
              className="
                rounded-2xl
                border border-white/12
                bg-white/8
                backdrop-blur-lg
                shadow-lg shadow-black/20
                p-6
                text-slate-50
              "
            >
              <p className="text-sm font-medium mb-1">
                Próxima sección: tabla de registros
              </p>
              <p className="text-sm text-slate-200/80">
                Aquí luego irá la tabla editable de gastos (categoría, monto,
                nota, fecha) con buscador, filtros y acciones para corregir
                registros. De momento solo usamos este bloque para validar
                layout y estilo.
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

// ────────────────────────────────────────
// Sidebar: contenido reutilizable
// ────────────────────────────────────────

interface SidebarContentProps {
  user: UserInfo;
  showCloseButton?: boolean;
  onCloseMobileSidebar?: () => void;
}

/**
 * Contenido del sidebar (logo, estado de cuenta, navegación y botón de logout).
 * Se usa tanto en desktop como dentro del drawer móvil.
 */
function SidebarContent({
  user,
  showCloseButton = false,
  onCloseMobileSidebar,
}: SidebarContentProps) {
  // Etiqueta y colores del plan según el estado mock
  const planLabel = user.plan === "trial" ? "Trial" : "Activo";
  const planClasses =
    user.plan === "trial"
      ? "bg-amber-400 text-amber-950"
      : "bg-emerald-500 text-emerald-50";

  return (
    <div className="flex flex-col h-full">
      {/* CABECERA DEL SIDEBAR: logo + nombre app */}
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        {/* Logo Dinvox (svg en /public/logo.svg) */}
        <div className="w-9 h-9 rounded-lg bg-black/20 flex items-center justify-center mr-3">
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
          <span className="text-xs text-slate-200">
            Asistente de gastos diarios
          </span>
        </div>

        {/* Botón de cerrar solo visible en el drawer móvil */}
        {showCloseButton && onCloseMobileSidebar && (
          <button
            type="button"
            className="ml-auto inline-flex items-center justify-center rounded-md p-1 text-slate-200 hover:bg-black/20 md:hidden"
            onClick={onCloseMobileSidebar}
            aria-label="Cerrar menú lateral"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* BLOQUE: estado de la cuenta (similar a Finkus: Usuario / Activo) */}
      <div className="px-6 py-4 border-b border-white/10">
        <p className="text-xs uppercase tracking-wide text-slate-300 mb-1">
          Usuario
        </p>

        <p className="text-sm font-semibold truncate mb-2">{user.name}</p>

        <div className="inline-flex items-center gap-2">
          {/* Punto de color + texto del plan */}
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${planClasses}`}
          >
            <span className="w-2 h-2 rounded-full bg-black/20 mr-2" />
            {planLabel}
          </span>
        </div>
      </div>

      {/* NAVEGACIÓN PRINCIPAL */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Sección: análisis de gastos */}
        <p className="mb-2 text-[11px] uppercase tracking-wide text-slate-300 px-2">
          Gastos
        </p>

        <SidebarItem label="Dashboard" active icon={<PieChart size={18} />} />
        <SidebarItem
          label="Tabla de registros"
          icon={<Table size={18} />}
        />
        <SidebarItem
          label="Análisis avanzado (próximamente)"
          icon={<BarChart3 size={18} />}
          disabled
        />

        {/* Sección: cuenta / ajustes */}
        <p className="mt-4 mb-2 text-[11px] uppercase tracking-wide text-slate-300 px-2">
          Cuenta
        </p>

        <SidebarItem label="Configuración" icon={<Settings size={18} />} />
        <SidebarItem label="Ayuda / Cómo usar Dinvox" icon={<HelpCircle size={18} />} />
      </nav>

      {/* BOTÓN DE SALIDA ABAJO */}
      <div className="p-4 border-t border-white/10">
        <button
          type="button"
          className="w-full inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium bg-white/90 text-slate-800 hover:bg-white transition"
        >
          <LogOut size={16} className="mr-2" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────
// Componente pequeño para cada item de menú
// ────────────────────────────────────────

interface SidebarItemProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
}

/**
 * Item reutilizable del sidebar.
 * Cambia estilos según si está activo o deshabilitado.
 */
function SidebarItem({
  label,
  active = false,
  disabled = false,
  icon,
}: SidebarItemProps) {
  const baseClasses =
    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition";

  const stateClasses = disabled
    ? "text-slate-400 cursor-not-allowed"
    : active
    ? "bg-white/15 text-slate-50 shadow-sm"
    : "text-slate-200 hover:bg-black/20 hover:text-white";

  return (
    <button
      type="button"
      className={`${baseClasses} ${stateClasses}`}
      disabled={disabled}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="truncate">{label}</span>
    </button>
  );
}
