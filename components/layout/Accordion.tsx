// components\layout\Accordion.tsx
// ----------------------------------------------
// Contenedor de secciones colapsables.
// - Permite UNA sección abierta a la vez.
// - Define sección abierta por defecto.
// - Centraliza el estado del accordion (open / close).

"use client";

import { ReactNode, useState } from "react";

type AccordionProps = {
  defaultOpenKey: string;
  children: ReactNode;
};

type SectionProps = {
  sectionKey: string;
  title: string;
  icon?: ReactNode;      // 👈 FALTABA
  children: ReactNode;
};

export function Accordion({
  defaultOpenKey,
  children,
}: AccordionProps) {
  const [openKey, setOpenKey] = useState<string | null>(defaultOpenKey);

  return (
    <div className="flex flex-col gap-6">
      {Array.isArray(children) &&
        children.map((child: any) => {
          if (!child) return null;

          const {
            sectionKey,
            title,
            icon,
            children: sectionChildren,
          } = child.props as SectionProps;

          const isOpen = openKey === sectionKey;

          return (
            <div key={sectionKey}>
              {child.type({
                title,
                icon, // 👈 ahora sí llega
                isOpen,
                onToggle: () =>
                  setOpenKey(isOpen ? null : sectionKey),
                children: sectionChildren,
              })}
            </div>
          );
        })}
    </div>
  );
}
