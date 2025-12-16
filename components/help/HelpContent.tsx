"use client";

/*
  Componente: HelpContent
  Ruta de uso: src/app/help/page.tsx

  Qué hace:
  - Renderiza el contenido de la página de Ayuda de Dinvox.
  - Muestra secciones desplegables (accordion) usando <details>/<summary>.
  - El texto real de cada sección vive fuera del componente
    en el archivo `help-sections.ts`.

  Por qué está hecho así:
  - Mantener este componente limpio (solo UI).
  - Poder editar textos sin tocar JSX ni lógica.
  - Escalar fácilmente a más secciones en el futuro.
*/

import { HELP_SECTIONS } from "@/components/help/help-sections";

export default function HelpContent() {
  return (
    // Contenedor principal
    // max-w ajustado para desktop, centrado, responsive
    <div className="w-full max-w-4xl xl:max-w-5xl mx-auto">
      {/* Card principal de ayuda */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-6 sm:p-8">
          {/* Título de la página */}
          <h2 className="text-2xl font-semibold text-slate-900">
            Ayuda / Cómo usar Dinvox
          </h2>

          {/* Texto introductorio corto */}
          <p className="mt-2 text-slate-600">
            Encuentra aquí cómo funciona Dinvox y cómo sacarle provecho.
          </p>

          {/* Lista de secciones desplegables */}
          <div className="mt-6 space-y-3">
            {HELP_SECTIONS.map((section) => (
              <details
                key={section.id}
                // Cada sección es un accordion simple
                className="group rounded-xl border border-slate-200 bg-slate-50/50 p-4"
              >
                {/* Encabezado clickable */}
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <span className="text-base font-medium text-slate-900">
                    {section.title}
                  </span>

                  {/* Indicador visual de abrir/cerrar */}
                  <span className="text-slate-500 transition-transform duration-200 group-open:rotate-180">
                    ▾
                  </span>
                </summary>

                {/* Contenido de la sección */}
                {/* 
                  whitespace-pre-line:
                  - Respeta saltos de línea del texto
                  - Permite escribir contenido largo sin JSX complejo
                */}
                <div className="mt-3 whitespace-pre-line text-sm text-slate-700 leading-relaxed">
                  {section.body}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
