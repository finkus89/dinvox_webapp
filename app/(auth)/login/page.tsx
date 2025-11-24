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

  // =====================================================
  // MANEJAR LOGIN
  // =====================================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
      // No mostramos el error crudo de Supabase, solo algo amable
      setErrorGeneral("Correo o contraseña incorrectos.");
      return;
    }

    // Si todo OK → redirigir al dashboard
    router.push("/dashboard");
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
        {/* ============================================
            AGREGAMOS onSubmit={handleLogin}
            ============================================ */}
        <form className="space-y-4" onSubmit={handleLogin}>

          {/* ===========================
              EMAIL
             =========================== */}
          <input
            type="text"
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

          {/* ===========================
              CONTRASEÑA
             =========================== */}
          <input
            type="password"
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

          {/* ===========================
              ERROR GENERAL (LOGIN)
             =========================== */}
          {errorGeneral && (
            <p className="text-red-400 text-xs mt-2 text-center">
              {errorGeneral}
            </p>
          )}

          {/* BOTÓN PRINCIPAL */}
          <button
            type="submit"
            className="
                  w-full rounded-xl py-3 font-medium
                      bg-gradient-to-r from-brand-700 to-brand-500
                      text-white
                      shadow-lg shadow-black/20
                      hover:from-brand-600 hover:to-brand-400
                      transition
              "
          >
            Iniciar sesión
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
