// Página de login de Dinvox

"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

// ===========================
// Importar cliente Supabase
// ===========================
import { createClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  // =====================================================
  // ESTADOS PARA LOGIN + VALIDACIONES
  // =====================================================
  const [email, setEmail] = useState("");           // email normalizado
  const [password, setPassword] = useState("");     // contraseña
  const [errorEmail, setErrorEmail] = useState(""); // error bajo input email
  const [errorPassword, setErrorPassword] = useState(""); // error bajo input pass
  const [errorGeneral, setErrorGeneral] = useState("");   // error general
  const router = useRouter();

  // =====================================================
  // Función para limpiar errores al escribir
  // =====================================================
  const clearErrors = () => {
    setErrorEmail("");
    setErrorPassword("");
    setErrorGeneral("");
  };
  const [isSubmitting, setIsSubmitting] = useState(false);

  // =====================================================
  // MANEJAR LOGIN
  // =====================================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    clearErrors();

    // Normalizar email
    const cleanEmail = email.trim().toLowerCase();

    // ------------------------
    // VALIDAR EMAIL
    // ------------------------
    if (!cleanEmail) {
      setErrorEmail("El correo es obligatorio.");
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorEmail("Correo inválido.");
      return;
    }

    // ------------------------
    // VALIDAR CONTRASEÑA
    // ------------------------
    if (!password) {
      setErrorPassword("La contraseña es obligatoria.");
      return;
    }

    // ------------------------
    // SUPABASE LOGIN
    // ------------------------
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      // Si el error viene por correo no confirmado, avisamos explícito
      const msg = error.message?.toLowerCase() ?? "";

      if (msg.includes("email not confirmed") || msg.includes("confirm your email")) {
        setErrorGeneral("Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.");
      } else {
        // Mensaje genérico para credenciales incorrectas
        setErrorGeneral("Correo o contraseña incorrectos.");
      }

      return;
    }

    // Si login fue exitoso, obtenemos el usuario autenticado
    const user = data.user;
    if (!user) {
      setErrorGeneral("No pudimos obtener tu usuario. Intenta nuevamente.");
      return;
    }

    // ==========================================================
    // 0) ASEGURAR QUE EXISTA PERFIL EN public.users (SOLO SI NO EXISTE)
    // ==========================================================
    try {
      // ¿Ya hay fila en users para este auth_user_id?
      const { data: existingProfile, error: existingError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (existingError) {
        console.error("Error buscando perfil existente:", existingError);
        // no bloqueamos el login por esto
      }

      if (!existingProfile) {
        // No existe perfil -> lo creamos UNA sola vez usando user_metadata
        const meta: any = user.user_metadata || {};

        const { error: insertError } = await supabase.from("users").insert({
          auth_user_id: user.id,
          email: user.email ?? cleanEmail,
          name: meta.name ?? null,
          phone_country_code: meta.phone_country_code ?? null,
          phone_national: meta.phone_national ?? null,
          phone_e164: meta.phone_e164 ?? null,
          channel: meta.channel ?? "telegram",
          language: meta.language ?? null,
          currency: meta.currency ?? null,
          timezone: meta.timezone ?? null,
          terms_accepted_at:meta.terms_accepted_at ?? new Date().toISOString(),
        });

        if (insertError) {
          console.error("Error creando perfil en users:", insertError);
          // tampoco bloqueamos el login
        }
      }
    } catch (e) {
      console.error("Error inesperado asegurando perfil:", e);
      // no bloqueamos el login
    }


    // ==========================================================
    // 1) CONSULTAR PERFIL EN TABLA public.users
    //    para saber si ya tiene telegram_chat_id
    // ==========================================================
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("telegram_chat_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (profileError) {
      // Si algo falla al leer el perfil, no bloqueamos al usuario:
      // lo mandamos al dashboard como fallback y luego lo depuramos.
      console.error("Error cargando perfil de usuario:", profileError);
      router.push("/dashboard");
      return;
    }

    // ==========================================================
    // 2) DECISIÓN DE RUTA:
    //    - Si NO tiene telegram_chat_id → conectar Telegram
    //    - Si SÍ tiene telegram_chat_id → dashboard
    // ==========================================================
      if (!profile || !profile.telegram_chat_id) {
        router.push("/connect-telegram");
      } else {
        router.push("/dashboard");
      }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4">
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
            width={96}
            height={96}
            className="opacity-90"
            priority
          />
        </div>

        {/* TÍTULO */}
        <h1 className="text-center text-4xl font-semibold text-white mb-2">
          Dinvox
        </h1>

        <p className="text-center text-sm text-white/70 mb-6">
          Registra tus gastos hablando. Nosotros los organizamos.
        </p>

        {/* FORMULARIO */}
        <form className="space-y-4" onSubmit={handleLogin}>
          {/* EMAIL */}
          <input
            type="text"
            maxLength={254}
            placeholder="Correo o usuario"
            className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
            value={email}
            onChange={(e) => {
              clearErrors();
              setEmail(e.target.value);
            }}
          />

          {/* Error bajo email */}
          {errorEmail && (
            <p className="text-red-400 text-xs mt-1">{errorEmail}</p>
          )}

          {/* CONTRASEÑA */}
          <input
            type="password"
            maxLength={128}
            placeholder="Contraseña"
            className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
            value={password}
            onChange={(e) => {
              clearErrors();
              setPassword(e.target.value);
            }}
          />

          {/* Error bajo password */}
          {errorPassword && (
            <p className="text-red-400 text-xs mt-1">{errorPassword}</p>
          )}

          {/* ERROR GENERAL (LOGIN) */}
          {errorGeneral && (
            <p className="text-red-400 text-xs mt-2 text-center">
              {errorGeneral}
            </p>
          )}

          {/* BOTÓN PRINCIPAL */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`
              w-full rounded-xl py-3 font-medium
              bg-gradient-to-r from-brand-700 to-brand-500
              text-white
              shadow-lg shadow-black/20
              hover:from-brand-600 hover:to-brand-400
              transition
              ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}
            `}
          >
            {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-white/70">
          ¿Nuevo en Dinvox?{" "}
          <a href="/register" className="underline underline-offset-4">
            Crear cuenta
          </a>
        </div>

        <div className="mt-2 text-center text-xs text-white/60">
          <a href="/forgot-password" className="hover:underline">
            ¿Olvidaste tu contraseña?
          </a>
        </div>
      </div>
    </div> 
  );
}
