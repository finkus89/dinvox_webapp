"use client";

/*
  Página: Conectar WhatsApp
  -------------------------
  - Misma lógica que /connect-telegram.
  - Obtiene el usuario actual desde Supabase Auth.
  - Busca en public.users el token y (si existe) wa_id.
  - Genera un link wa.me con un mensaje prellenado: "/start <token>"
  - Hace polling hasta detectar wa_id y luego redirige a /dashboard.

  Requisito:
  - Debes poner tu número de WhatsApp (Cloud API) en formato internacional SIN "+".
    Ej: +57 300 123 4567  ->  "573001234567"
*/

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

// ⚠️ IMPORTANTE: cambia esto por tu número real (sin +, sin espacios)
const WHATSAPP_NUMBER_NO_PLUS = "573162455198";

type UserProfileRow = {
  token: string | null;
  wa_id: string | null;
};

export default function ConnectWhatsAppPage() {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [alreadyConnected, setAlreadyConnected] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const supabase = createClient();

      // 1) Obtener usuario autenticado
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
        setErrorMessage("Debes iniciar sesión para conectar tu cuenta con WhatsApp.");
        setLoading(false);
        return;
      }

      // 2) Buscar perfil en public.users
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("token, wa_id")
        .eq("auth_user_id", userData.user.id)
        .maybeSingle<UserProfileRow>();

      if (profileError) {
        setErrorMessage("No pudimos cargar tu perfil. Intenta de nuevo más tarde.");
        setLoading(false);
        return;
      }

      if (!profile) {
        setErrorMessage(
          "No encontramos tu perfil de usuario. Si el problema persiste, contacta soporte."
        );
        setLoading(false);
        return;
      }

      if (profile.wa_id) {
        setAlreadyConnected(true);
      }

      setToken(profile.token);
      setLoading(false);
    };

    run();
  }, []);

  // Polling: esperar a que aparezca wa_id
  useEffect(() => {
    if (loading || errorMessage) return;

    const supabase = createClient();

    if (alreadyConnected) {
      router.push("/dashboard");
      return;
    }

    const intervalId = setInterval(async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        clearInterval(intervalId);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("wa_id")
        .eq("auth_user_id", userData.user.id)
        .maybeSingle<UserProfileRow>();

      if (profileError || !profile) return;

      if (profile.wa_id) {
        clearInterval(intervalId);
        setAlreadyConnected(true);
        router.push("/dashboard");
      }
    }, 4000);

    return () => clearInterval(intervalId);
  }, [alreadyConnected, loading, errorMessage, router]);

  // Mensaje que queremos que el usuario envíe
  const startText = token ? `/start ${token}` : null;

  // Link wa.me con texto prellenado
  // Importante: wa.me requiere número sin + y el texto debe ir URL-encoded.
  const whatsappLink =
    startText && WHATSAPP_NUMBER_NO_PLUS
      ? `https://wa.me/${WHATSAPP_NUMBER_NO_PLUS}?text=${encodeURIComponent(startText)}`
      : null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4">
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
        <h1 className="text-center text-3xl font-semibold text-white mb-3">
          Conecta Dinvox con WhatsApp
        </h1>

        <p className="text-center text-sm text-white/70 mb-6">
          Abre WhatsApp con tu enlace personal y envía el comando de conexión.
        </p>

        {loading && (
          <p className="text-center text-white/70 text-sm">
            Cargando tu enlace personal de WhatsApp…
          </p>
        )}

        {!loading && errorMessage && (
          <p className="text-center text-red-300 text-sm mb-4">{errorMessage}</p>
        )}

        {!loading && !errorMessage && (
          <>
            {alreadyConnected && (
              <p className="text-center text-emerald-300 text-sm mb-4">
                Tu cuenta ya está conectada a WhatsApp.
              </p>
            )}

            <div className="space-y-4 text-sm text-white/80 mb-6">
              <div>
                <h2 className="font-semibold mb-1">1. Si estás en tu celular</h2>
                {whatsappLink ? (
                  <p>
                    Toca el botón para abrir WhatsApp con tu comando listo.
                    Solo envíalo.
                  </p>
                ) : (
                  <p>No pudimos generar tu enlace personal.</p>
                )}
              </div>

              <div>
                <h2 className="font-semibold mb-1">2. Si estás en el computador</h2>
                <p>
                  Abre WhatsApp en tu celular y envía este comando a Dinvox:
                </p>
                <p className="mt-2 font-mono text-xs bg-black/40 rounded-md px-3 py-2">
                  {startText ?? "No se encontró tu token personal."}
                </p>
              </div>

              {whatsappLink && (
                <div>
                  <h2 className="font-semibold mb-1">Enlace directo</h2>
                  <p className="text-xs mb-1">
                    También puedes copiar este enlace y abrirlo desde donde prefieras:
                  </p>
                  <p className="font-mono text-[11px] bg-black/40 rounded-md px-3 py-2 break-all">
                    {whatsappLink}
                  </p>
                </div>
              )}
            </div>

            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="
                  block w-full text-center rounded-xl py-3 font-medium
                  bg-gradient-to-r from-brand-700 to-brand-500
                  text-white
                  shadow-lg shadow-black/20
                  hover:from-brand-600 hover:to-brand-400
                  transition
                "
              >
                Abrir WhatsApp
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}
