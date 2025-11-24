// Página de login de Dinvox

"use client";

import Image from "next/image";

export default function LoginPage() {
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
        <form className="space-y-4">
          <input
            type="text"
            placeholder="Correo o usuario"
            className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
          />

          <input
            type="password"
            placeholder="Contraseña"
            className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
          />

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
