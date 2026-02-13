// src/app/(app)/help/page.tsx
// ------------------------------------------------------------
// Dinvox | Ayuda / Cómo usar Dinvox
//
// Contexto:
// - El "cascarón" común (Sidebar + Header + PageContainer + banner trial)
//   vive en: src/app/(app)/layout.tsx
// - Esta página SOLO renderiza el contenido específico de /help.
//
// Qué incluye esta página:
// - HelpContent: guía de uso, comandos, tips y explicación del flujo.
//
// Notas:
// - Ya NO se hace fetch del usuario aquí.
// - Ya NO se renderiza Header/Sidebar aquí.
// ------------------------------------------------------------

"use client";

import HelpContent from "@/components/help/HelpContent";

export default function HelpPage() {
  return <HelpContent />;
}
