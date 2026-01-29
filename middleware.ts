// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ⚠️ Rutas que deben saltarse SIEMPRE
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/auth/callback")||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/forgot-password")
  ) {
    return NextResponse.next();
  }

  // 🧠 Detección de sesión Supabase
  // Buscar cualquier cookie sb-*-auth-token
  const hasSession = Array.from(req.cookies.getAll())
  .some((c) => c.name.includes("sb-") && c.name.includes("-auth-token"));


  // 🟢 Rutas públicas de autenticación
  const publicAuthRoutes = ["/login", "/register"];

  // 🔒 Rutas protegidas del dashboard
  const protectedRoutes = ["/dashboard", "/connect-telegram",  "/expenses", "/performance","/settings", "/help"];

  const isPublicAuth = publicAuthRoutes.some((r) =>
    pathname.startsWith(r)
  );

  const isProtected = protectedRoutes.some((r) =>
    pathname.startsWith(r)
  );

  // 🟢 Login/Register → SIEMPRE permitir
  if (isPublicAuth) {
    return NextResponse.next();
  }

  // 🔒 Si no tiene sesión y va a un área protegida → login
  if (!hasSession && isProtected) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Configuración del middleware
export const config = {
  matcher: [
    "/reset-password",
    "/forgot-password",
    "/(login|register)",
    "/dashboard/:path*",
    "/connect-telegram/:path*",
    "/expenses/:path*",
    "/performance/:path*",
    "/settings/:path*",
    "/help/:path*",
    "/auth/:path*",
  ],
};