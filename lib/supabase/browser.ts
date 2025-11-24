// /lib/supabase/browser.ts
// ------------------------------------------------------
// Cliente Supabase para uso en componentes cliente (browser)
// Se usa en formularios: register, login, onboarding, etc.
// ------------------------------------------------------

import { createBrowserClient } from "@supabase/ssr"; 
// createBrowserClient = cliente Supabase optimizado para Next.js App Router

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );
}