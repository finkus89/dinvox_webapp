// Página de restablecimiento de contraseña de Dinvox
// app\(auth)\reset-password\page.tsx
// -------------------------------------------------
// Permite crear una nueva contraseña solo si el usuario
// llega desde un enlace válido de recuperación (Supabase).
// Si el enlace es inválido o expiró, bloquea el formulario.

"use client";

import Image from "next/image";
import Link from "next/link";

// NUEVO: hooks y router
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// NUEVO: cliente Supabase (browser)
import { createClient } from "@/lib/supabase/browser";

export default function ResetPasswordPage() {
  // NUEVO: inicializar Supabase y router
  const supabase = createClient();
  const router = useRouter();

  // NUEVO: estados mínimos
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false); // solo true si hay sesión recovery

  // NUEVO: verificar si existe una sesión válida de recuperación
  useEffect(() => {
    const run = async () => {
      setError(null);

      // 1) Canjear el code PKCE por sesión
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error || !data?.session) {
          setError("El enlace es inválido o ha expirado. Solicita uno nuevo.");
          setReady(false);
          return;
        }

        setReady(true);

        // Limpiar la URL (opcional pero recomendado)
        url.searchParams.delete("code");
        window.history.replaceState({}, "", url.toString());

        return; // <- CLAVE: no sigas a getSession()
      }


      // 2) Verificar que ya exista sesión
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setError("El enlace es inválido o ha expirado. Solicita uno nuevo.");
        setReady(false);
        return;
      }

      setReady(true);
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // NUEVO: handler del formulario
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !ready) return;

    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError("No se pudo actualizar la contraseña. Intenta de nuevo.");
        return;
      }

      // NUEVO: cerrar sesión recovery y redirigir a login
      await supabase.auth.signOut();
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }

  return (
    // Contenedor que centra la tarjeta (el fondo viene del layout (auth))
    <div className="w-full min-h-screen flex items-center justify-center px-4">
      <div
        className="
          w-full max-w-md
          rounded-2xl
          border border-white/20
          bg-white/10
          backdrop-blur-xl
          shadow-2xl shadow-black/20
          p-8
        "
      >
        {/* LOGO */}
        <div className="mx-auto mb-6 flex justify-center">
          <Link href="/" aria-label="Volver al inicio">
            <Image
              src="/logo.svg"
              alt="Logo Dinvox"
              width={86}
              height={86}
              className="opacity-90 hover:opacity-100 transition cursor-pointer"
              priority
            />
          </Link>
        </div>

        {/* TÍTULO */}
        <h1 className="text-center text-3xl font-light text-white mb-2">
          Restablecer contraseña
        </h1>
        <p className="text-center text-white/70 text-sm mb-6">
          Ingresa tu nueva contraseña y confírmala para continuar.
        </p>

        {/* NUEVO: mensaje de error general */}
        {error && (
          <div className="mb-4 text-sm text-red-200 bg-red-500/10 border border-red-300/20 rounded-xl px-3 py-2 text-center">
            {error}
          </div>
        )}

        {/* FORMULARIO */}
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <input
              type="password"
              placeholder="Nueva contraseña"
              className="
                w-full rounded-xl border border-white/20 bg-white/10
                px-4 py-3 text-white placeholder-white/60
                focus:outline-none focus:ring-2 focus:ring-white/40
              "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!ready || loading}
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Confirmar contraseña"
              className="
                w-full rounded-xl border border-white/20 bg-white/10
                px-4 py-3 text-white placeholder-white/60
                focus:outline-none focus:ring-2 focus:ring-white/40
              "
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              disabled={!ready || loading}
            />
          </div>

          {/* BOTÓN PRINCIPAL */}
          <button
            type="submit"
            disabled={!ready || loading}
            className="
              w-full rounded-xl py-3 font-medium
              bg-gradient-to-r from-brand-700 to-brand-500
              text-white
              shadow-lg shadow-black/20
              hover:from-brand-600 hover:to-brand-400
              transition
              disabled:opacity-60
            "
          >
            {loading ? "Guardando..." : "Guardar nueva contraseña"}
          </button>
        </form>

        {/* ENLACE DE REGRESO */}
        <div className="mt-6 text-center text-sm text-white/70">
          <Link
            href="/login"
            className="underline underline-offset-4 hover:text-white"
          >
            Volver a iniciar sesión
          </Link>
        </div>

        {/* NUEVO: acceso rápido si el enlace expiró */}
        {!ready && (
          <div className="mt-4 text-center text-sm text-white/60">
            <Link
              href="/forgot-password"
              className="underline underline-offset-4 hover:text-white"
            >
              Solicitar un nuevo enlace
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
