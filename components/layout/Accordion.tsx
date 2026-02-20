// components\layout\Accordion.tsx
// ----------------------------------------------
// Contenedor de secciones colapsables.
// - Permite UNA sección abierta a la vez.
// - Define sección abierta por defecto.
// - Centraliza el estado del accordion (open / close).
//
// 🆕 Fix importante:
// - Antes SOLO renderizaba si `children` era un array.
// - Cuando hay 1 sola sección, React pasa `children` como un solo elemento (NO array),
//   y el accordion quedaba vacío.
// - Ahora normalizamos con React.Children.toArray(children) para soportar 1 o N secciones.

"use client";

import React, { ReactNode, useState } from "react";

type AccordionProps = {
  defaultOpenKey: string;
  children: ReactNode;
};

type SectionProps = {
  sectionKey: string;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
};

export function Accordion({ defaultOpenKey, children }: AccordionProps) {
  const [openKey, setOpenKey] = useState<string | null>(defaultOpenKey);

  // ✅ Normaliza children a array siempre (1 o N)
  const items = React.Children.toArray(children) as any[];

  return (
    <div className="flex flex-col gap-6">
      {items.map((child: any) => {
        if (!child) return null;

        const { sectionKey, title, icon, children: sectionChildren } =
          (child.props as SectionProps) ?? {};

        // Guardas mínimas para evitar crasheos si llega algo raro
        if (!sectionKey) return null;

        const isOpen = openKey === sectionKey;

        return (
          <div key={sectionKey}>
            {child.type({
              title,
              icon,
              isOpen,
              onToggle: () => setOpenKey(isOpen ? null : sectionKey),
              children: sectionChildren,
            })}
          </div>
        );
      })}
    </div>
  );
}