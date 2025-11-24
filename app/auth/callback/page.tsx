"use client";

/*
  Página de Callback de Supabase (Confirmación de Email)
  ------------------------------------------------------
  - Mantiene el mismo layout y fondo del grupo (auth)
  - Intercambia el code de Supabase por sesión válida
  - Muestra un mensaje elegante
  - Proporciona botón para ir a iniciar sesión
*/

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function AuthCallbackPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();

  // El código que envía Supabase
  const code = params.get("code");

  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const processCode = async () => {
      if (!code) {
        setStatusMessage("Código inválido o ausente.");
        setLoading(false);
        return;
      }

      // Intercambiar code por sesión
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        setStatusMessage("Hubo un error confirmando tu correo. Intenta de nuevo.");
        setLoading(false);
        return;
      }

      setStatusMessage("¡Tu correo ha sido confirmado exitosamente!");
      setLoading(false);
    };

    processCode();
  }, [code, supabase]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4">

      {/* Tarjeta elegante, igual estilo a login/register */}
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
        {/* Título */}
        <h1 className="text-center text-3xl font-semibold text-white mb-4">
          Confirmación de correo
        </h1>

        {/* Estado */}
        {loading ? (
          <p className="text-center text-white/70 text-sm">
            Validando tu cuenta, por favor espera…
          </p>
        ) : (
          <p className="text-center text-white/90 text-md mb-6">
            {statusMessage}
          </p>
        )}

        {/* Botón para login */}
        {!loading && (
          <button
            onClick={() => router.push("/login")}
            className="
              mt-4 w-full rounded-xl py-3 font-medium
              bg-gradient-to-r from-brand-700 to-brand-500
              text-white shadow-lg shadow-black/20
              hover:from-brand-600 hover:to-brand-400
              transition
            "
          >
            Ir a iniciar sesión
          </button>
        )}
      </div>
    </div>
  );
}
