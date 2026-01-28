// webapp/components/layout/Sidebar.tsx
// ------------------------------------
// Sidebar reutilizable para Dinvox
// - Usa el mismo diseño que ya tenías
// - Recibe el nombre del usuario y la función de logout
// ------------------------------------

"use client";

import Image from "next/image";
import {
  Home,
  Table2,
  TrendingUp,
  HelpCircle,
  Settings,
  LogOut,
  X,
  LineChart,
} from "lucide-react";
import type { ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";


interface SidebarProps {
  // Nombre a mostrar (ya formateado desde el Dashboard, ej: "Carlos Díaz")
  userName: string;
  showCloseButton?: boolean;
  onCloseMobileSidebar?: () => void;
  onLogout?: () => void;
}

export function Sidebar({
  userName,
  showCloseButton = false,
  onCloseMobileSidebar,
  onLogout,
}: SidebarProps) {
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
        <p className="text-sm font-medium truncate mb-2">{userName}</p>

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

        <SidebarItem
          label="Dashboard"
          href="/dashboard"
          icon={<Home size={18} />}
        />
        <SidebarItem
          label="Tabla de Gastos"
          href="/expenses"
          icon={<Table2 size={18} />}
        />
        <SidebarItem
          label="Desempeño"
          href="/performance"
          icon={<LineChart size={18} />}
        />

        {/* Grupo: CUENTA */}
        <SidebarSectionLabel label="Cuenta" />

        <SidebarItem 
          label="Configuración" 
          href="/settings"
          icon={<Settings size={18} />} 
        />

        <SidebarItem
          label="Ayuda / Cómo usar Dinvox"
          href="/help"
          icon={<HelpCircle size={18} />}
        />
      </nav>

      {/* BLOQUE INFERIOR: Cerrar sesión */}
      <div className="p-4 border-t border-white/10">
        <button
          type="button"
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
  href?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

function SidebarItem({ label, href, icon, disabled = false }: SidebarItemProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = href ? pathname === href : false;

  const handleClick = () => {
    if (disabled || !href) return;
    router.push(href);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition
        ${isActive ? "bg-white/15 text-slate-50 shadow-sm" : "text-slate-200/80 hover:bg-white/10 hover:text-white"}
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
