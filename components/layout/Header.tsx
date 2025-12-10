"use client";

/*
  HEADER DEL DASHBOARD – Dinvox
  ------------------------------
  - Recibe nombre, idioma y moneda desde la página principal.
  - Mantiene exactamente el estilo actual.
  - Idioma + Moneda se mueven a la derecha bajo el avatar.
  - No contiene lógica de Supabase.
*/

import { Menu } from "lucide-react";

interface HeaderProps {
  displayName: string;          // Nombre ya formateado (primera letra mayúscula)
  language?: string | null;     // Código de idioma desde BD
  currency?: string | null;     // Código de moneda desde BD
  onOpenSidebar: () => void;    // Función para abrir sidebar móvil
  title?: string;               // 🔹 Nuevo: título dinámico ("Dashboard", "Tabla de gastos", etc.)
}

export default function Header({
  displayName,
  language,
  currency,
  onOpenSidebar,
  title,
}: HeaderProps) {
  return (
    <header
      className="
        h-16 min-h-[64px]          /* 🔹 Altura fija del header */
        flex-shrink-0              /* 🔹 Evita que se comprima en algunos layouts */
        flex items-center justify-between 
        px-4 sm:px-6 
        bg-white border-b border-slate-200 shadow-sm
      "
    >
      {/* IZQUIERDA: Título de página + Hola Carlos */}
      <div className="flex items-center gap-3">
        {/* Botón móvil */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          onClick={onOpenSidebar}
          aria-label="Abrir menú lateral"
        >
          <Menu size={20} />
        </button>

        <div>
          {/* 🔹 Título dinámico: usa el título recibido o "Dashboard" por defecto */}
          <p className="text-xs sm:text-sm text-slate-500">
            {title || "Dashboard"}
          </p>

          <h1 className="text-base sm:text-lg font-semibold text-slate-900">
            Hola, {displayName.split(" ")[0]}
          </h1>
        </div>
      </div>

      {/* DERECHA: Avatar + Idioma + Moneda */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col text-right leading-tight">
          {/* Idioma */}
          <p className="text-[11px] text-slate-500">
            Idioma: {(language ?? "ES").toUpperCase()}
          </p>

          {/* Moneda */}
          <p className="text-[11px] text-slate-500">
            Moneda: {(currency ?? "COP").toUpperCase()}
          </p>
        </div>

        {/* Avatar (primera letra del nombre) */}
        <div
          className="
            w-9 h-9 rounded-full bg-slate-200
            flex items-center justify-center
            text-xs font-semibold text-slate-600
          "
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
