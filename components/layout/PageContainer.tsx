// webapp/components/layout/PageContainer.tsx
// ------------------------------------------
// Contenedor genérico para el contenido principal del dashboard
// - Aplica padding, fondo gris y max-width
// - Se reutiliza en Dashboard y luego en otras páginas (Tabla de registros, etc.)
"use client";

import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
}

export default function PageContainer({ children }: PageContainerProps) {
  return (
    <main className="flex-1 bg-slate-100 px-3 sm:px-5 pt-3 pb-4">
      <div className="max-w-6xl mx-auto space-y-4">
        {children}
      </div>
    </main>
  );
} 
