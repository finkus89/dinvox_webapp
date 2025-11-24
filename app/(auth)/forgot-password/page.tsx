"use client";

import Image from "next/image";

export default function ForgotPasswordPage() {
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
        <form className="space-y-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            className="
              w-full rounded-xl border border-white/20 bg-white/10 
              px-4 py-3 text-white placeholder-white/60
              focus:outline-none focus:ring-2 focus:ring-white/40
            "
          />

          {/* BOTÓN */}
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
            Enviar enlace de recuperación
          </button>
        </form>

        {/* ENLACE DE REGRESO */}
        <div className="mt-6 text-center text-sm text-white/70">
          <a
            href="/login"
            className="underline underline-offset-4 hover:text-white"
          >
            Volver a iniciar sesión
          </a>
        </div>
      </div>
    </div>
  );
}
