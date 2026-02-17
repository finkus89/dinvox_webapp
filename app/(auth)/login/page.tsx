// Página de login de Dinvox
"use client";

/*
  Login Dinvox (Auth + bootstrap de perfil + routing por canal)
  ------------------------------------------------------------
  Esta página hace 4 cosas:

  1) Valida credenciales (email + password) y realiza login con Supabase Auth.
  2) Bootstrap de perfil en public.users:
     - Dinvox guarda datos iniciales (incl. channel) en Auth como user_metadata
       (auth.users.raw_user_meta_data) durante el registro.
     - En el PRIMER login, si no existe fila en public.users para este auth_user_id,
       esta página la crea copiando esos metadatos.
  3) Lee el perfil desde public.users (channel + ids de conexión) para decidir
     el siguiente paso.
  4) Routing por canal:
     - Si channel = "telegram"  -> requiere telegram_chat_id o envía a /connect-telegram
     - Si channel = "whatsapp"  -> requiere wa_id o envía a /connect-whatsapp
*/

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

// ===========================
// Importar cliente Supabase
// ===========================
import { createClient } from "@/lib/supabase/browser";

// 🆕 Helpers para evitar duplicación y bugs de submit
import { runSubmit, normalizeEmail, isValidEmail } from "@/lib/auth/form-helpers";

type Channel = "telegram" | "whatsapp";

export default function LoginPage() {
  // =====================================================
  // ESTADOS PARA LOGIN + VALIDACIONES
  // =====================================================
  const [email, setEmail] = useState(""); // email normalizado
  const [password, setPassword] = useState(""); // contraseña
  const [errorEmail, setErrorEmail] = useState(""); // error bajo input email
  const [errorPassword, setErrorPassword] = useState(""); // error bajo input pass
  const [errorGeneral, setErrorGeneral] = useState(""); // error general
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

    // --------------------------------------------------
    // ✅ ARREGLO (bug "se queda cargando"):
    // - Validamos primero (sin loading).
    // - runSubmit se encarga del lock + loading + finally.
    // --------------------------------------------------
    clearErrors();

    const cleanEmail = normalizeEmail(email);

    // ------------------------
    // VALIDAR EMAIL
    // ------------------------
    if (!cleanEmail) {
      setErrorEmail("El correo es obligatorio.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
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

    await runSubmit(isSubmitting, setIsSubmitting, async () => {
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
          setErrorGeneral(
            "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada."
          );
        } else {
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

            // Canal principal (viene de user_metadata; fallback por seguridad)
            channel: (meta.channel as Channel) ?? "telegram",

            language: meta.language ?? null,
            currency: meta.currency ?? null,
            timezone: meta.timezone ?? null,
            terms_accepted_at: meta.terms_accepted_at ?? new Date().toISOString(),

            // Nota: wa_id y telegram_chat_id se llenan al conectar cada canal.
          });

          if (insertError) {
            console.error("Error creando perfil en users:", insertError);
            // tampoco bloqueamos el login
          }
        }
      } catch (err) {
        console.error("Error inesperado asegurando perfil:", err);
        // no bloqueamos el login
      }

      // ==========================================================
      // 1) CONSULTAR PERFIL EN TABLA public.users
      //    - channel: canal principal elegido por el usuario
      //    - telegram_chat_id: si ya conectó Telegram
      //    - wa_id: si ya conectó WhatsApp
      // ==========================================================
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("channel,  pending_channel,telegram_chat_id, wa_id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error cargando perfil de usuario:", profileError);
        router.push("/dashboard"); // fallback
        return;
      }

      // Si por cualquier razón no hay perfil, fallback seguro
      if (!profile) {
        router.push("/dashboard");
        return;
      }

      const channel = (profile.channel as Channel) || "telegram";
      const pending = profile.pending_channel as Channel | null;

      // ==========================================================
      // 2) DECISIÓN DE RUTA SEGÚN CANAL PRINCIPAL
      // ==========================================================
      // aqui se revisa si esta pendeinte de hacer cambio de canal
      if (pending) {
        router.push(pending === "whatsapp" ? "/connect-whatsapp" : "/connect-telegram");
        return;
      }

      //si no es priemra vez q ca a hcer registro
      if (channel === "whatsapp") {
        // WhatsApp: requiere wa_id
        if (!profile.wa_id) {
          router.push("/connect-whatsapp");
          return;
        }
        router.push("/dashboard");
        return;
      }

      // Telegram (default): requiere telegram_chat_id
      if (!profile.telegram_chat_id) {
        router.push("/connect-telegram");
        return;
      }

      router.push("/dashboard");
    });
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
        <h1 className="text-center text-4xl font-semibold text-white mb-2">Dinvox</h1>

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
          {errorEmail && <p className="text-red-400 text-xs mt-1">{errorEmail}</p>}

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
            <p className="text-red-400 text-xs mt-2 text-center">{errorGeneral}</p>
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
