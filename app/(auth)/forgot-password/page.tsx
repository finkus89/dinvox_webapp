//app\(auth)\forgot-password\page.tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

// 🆕 Helpers reutilizables (submit lock + email helpers)
import { runSubmit, normalizeEmail, isValidEmail } from "@/lib/auth/form-helpers";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || sent) return;

    // --------------------------------------------------
    // ✅ ARREGLO / REFACTOR:
    // - Validamos primero (sin loading).
    // - Usamos helpers comunes (normalizeEmail + isValidEmail).
    // - runSubmit controla loading + evita doble envío + garantiza finally.
    // --------------------------------------------------
    setError(null);

    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail) {
      setError("Escribe tu correo.");
      return;
    }

    // (nuevo) validar formato para evitar enviar requests inútiles
    if (!isValidEmail(cleanEmail)) {
      setError("Correo inválido.");
      return;
    }

    await runSubmit(loading, setLoading, async () => {
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo,
      });

      // Importante: NO revelar si existe o no. Si hay error técnico, sí mostramos genérico.
      if (error) {
        setError("No se pudo enviar el enlace. Intenta de nuevo.");
        return;
      }

      setSent(true);
    });
  }

  return (
    // Contenedor que centra la tarjeta — el fondo ya viene desde el layout
    <div className="w-full min-h-screen flex items-center justify-center px-4">
      {/* Tarjeta */}
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
          <Image
            src="/logo.svg"
            alt="Logo Dinvox"
            width={86}
            height={86}
            className="opacity-90"
            priority
          />
        </div>

        {/* TÍTULO */}
        <h1 className="text-center text-3xl font-light text-white mb-2">
          Recuperar contraseña
        </h1>

        <p className="text-center text-white/70 text-sm mb-6">
          Ingresa tu correo y te enviaremos un enlace para restablecer el acceso.
        </p>

        {/* FORMULARIO */}
        {!sent ? (
          <form className="space-y-4" onSubmit={onSubmit}>
            <input
              type="email"
              placeholder="Correo electrónico"
              className="
                w-full rounded-xl border border-white/20 bg-white/10 
                px-4 py-3 text-white placeholder-white/60
                focus:outline-none focus:ring-2 focus:ring-white/40
              "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />

            {error && (
              <div className="text-sm text-red-200 bg-red-500/10 border border-red-300/20 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            {/* BOTON */}
            <button
              type="submit"
              disabled={loading}
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
              {loading ? "Enviando..." : "Enviar enlace de recuperación"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Respuesta */}
            <p className="text-center text-white/80 text-sm">
              Si el correo existe, te llegará un enlace para restablecer tu contraseña.
            </p>
            <p className="text-center text-white/60 text-sm">
              Revisa spam o promociones. El enlace puede tardar unos minutos.
            </p>

            {/* Redireccion a iniciar sesion */}
            <div className="pt-2 text-center text-sm text-white/70">
              <a href="/login" className="underline underline-offset-4 hover:text-white">
                Volver a iniciar sesión
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
