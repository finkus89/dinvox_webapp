// Página de restablecimiento de contraseña de Dinvox
// app\(auth)\reset-password\page.tsx
// -------------------------------------------------
// Permite crear una nueva contraseña solo si el usuario
// llega desde un enlace válido de recuperación (Supabase).
//
// ✅ IMPORTANTE (enero 2026):
// Cambiamos el email template de Supabase para que el enlace venga así:
//   /reset-password?token_hash=...&type=recovery
// Esto evita el problema PKCE ("code_verifier") que fallaba en algunos navegadores/correos.
// Por eso, aquí ya NO usamos exchangeCodeForSession(code).
//
// Si el enlace es inválido o expiró, bloquea el formulario.

"use client";

import Image from "next/image";
import Link from "next/link";

// Hooks y router
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Cliente Supabase (browser)
import { createClient } from "@/lib/supabase/browser";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();

  // Estados del formulario
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Solo true si hay sesión válida de recuperación (recovery)
  const [ready, setReady] = useState(false);

  // Verificar si existe una sesión válida de recuperación
  useEffect(() => {
    const run = async () => {
      setError(null);

      const url = new URL(window.location.href);

      // 1) Nuevo flujo (recomendado): token_hash + verifyOtp()
      // Viene del correo template: /reset-password?token_hash=...&type=recovery
      const token_hash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type");

      if (token_hash && type === "recovery") {
        const { error } = await supabase.auth.verifyOtp({
          type: "recovery",
          token_hash,
        });

        if (error) {
          setError("El enlace es inválido o ha expirado. Solicita uno nuevo.");
          setReady(false);
          return;
        }

        // Limpiar URL para evitar reintentos / confusión al recargar
        url.searchParams.delete("token_hash");
        url.searchParams.delete("type");
        window.history.replaceState({}, "", url.toString());

        setReady(true);
        return;
      }

      // 2) Si NO hay token_hash en la URL:
      // Puede ser que el usuario ya tenga una sesión recovery activa (p.ej. volvió a la pestaña)
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

  // Handler del formulario
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

      // Cerrar sesión recovery y redirigir a login
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

        {/* Mensaje de error */}
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

        {/* Acceso rápido si el enlace expiró */}
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
