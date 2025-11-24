"use client";

/*
  Página: Conectar Telegram
  -------------------------
  - Hereda el layout de (auth) → mismo fondo con gradiente.
  - Obtiene el usuario actual desde Supabase Auth.
  - Busca en public.users el token y (si existe) telegram_chat_id.
  - Muestra instrucciones para conectar el bot de Telegram.
*/

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

// ⚠️ IMPORTANTE: cambia esto por el username real de tu bot
const TELEGRAM_BOT_USERNAME = "DinvoxBot"; // ej: "dinvox_bot"

type UserProfileRow = {
  token: string | null;
  telegram_chat_id: string | null;
};

export default function ConnectTelegramPage() {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [alreadyConnected, setAlreadyConnected] = useState(false);

  useEffect(() => {
    const run = async () => {
      const supabase = createClient();

      // 1) Obtener usuario autenticado
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
        setErrorMessage(
          "Debes iniciar sesión para conectar tu cuenta con Telegram."
        );
        setLoading(false);
        return;
      }

      // 2) Buscar perfil en tabla public.users
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("token, telegram_chat_id")
        .eq("auth_user_id", userData.user.id)
        .maybeSingle<UserProfileRow>();

      if (profileError) {
        setErrorMessage(
          "No pudimos cargar tu perfil. Intenta de nuevo más tarde."
        );
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

      if (profile.telegram_chat_id) {
        // Ya estaba conectado a Telegram
        setAlreadyConnected(true);
      }

      setToken(profile.token);
      setLoading(false);
    };

    run();
  }, []);

  // Construir link al bot solo si hay token y username
  const telegramLink =
    token && TELEGRAM_BOT_USERNAME
      ? `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${token}`
      : null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4">
      {/* Tarjeta tipo glass igual estilo que login */}
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
        {/* Título principal */}
        <h1 className="text-center text-3xl font-semibold text-white mb-3">
          Conecta Dinvox con Telegram
        </h1>

        {/* Subtítulo */}
        <p className="text-center text-sm text-white/70 mb-6">
          Solo tienes que abrir el bot de Telegram con tu enlace personal y
          enviar el comando correspondiente.
        </p>

        {/* Estado: cargando */}
        {loading && (
          <p className="text-center text-white/70 text-sm">
            Cargando tu enlace personal de Telegram…
          </p>
        )}

        {/* Estado: error */}
        {!loading && errorMessage && (
          <p className="text-center text-red-300 text-sm mb-4">
            {errorMessage}
          </p>
        )}

        {/* Contenido principal cuando no hay error */}
        {!loading && !errorMessage && (
          <>
            {alreadyConnected && (
              <p className="text-center text-emerald-300 text-sm mb-4">
                Tu cuenta ya está conectada a Telegram. Si necesitas reconectar,
                puedes volver a usar tu enlace personal.
              </p>
            )}

            {/* Instrucciones */}
            <div className="space-y-4 text-sm text-white/80 mb-6">
              <div>
                <h2 className="font-semibold mb-1">1. Si estás en tu celular</h2>
                {telegramLink ? (
                  <p>
                    Toca el siguiente botón para abrir Telegram con tu enlace
                    personal. Asegúrate de tener la app instalada.
                  </p>
                ) : (
                  <p>No pudimos generar tu enlace personal.</p>
                )}
              </div>

              <div>
                <h2 className="font-semibold mb-1">
                  2. Si estás en el computador
                </h2>
                <p>
                  Abre Telegram en tu celular, busca el bot{" "}
                  <span className="font-mono">@{TELEGRAM_BOT_USERNAME}</span> y
                  envía este comando:
                </p>
                <p className="mt-2 font-mono text-xs bg-black/40 rounded-md px-3 py-2">
                  {token ? `/start ${token}` : "No se encontró tu token personal."}
                </p>
              </div>

              {telegramLink && (
                <div>
                  <h2 className="font-semibold mb-1">Enlace directo</h2>
                  <p className="text-xs mb-1">
                    También puedes copiar este enlace y abrirlo desde donde
                    prefieras:
                  </p>
                  <p className="font-mono text-[11px] bg-black/40 rounded-md px-3 py-2 break-all">
                    {telegramLink}
                  </p>
                </div>
              )}
            </div>

            {/* Botón principal: Abrir Telegram */}
            {telegramLink && (
              <a
                href={telegramLink}
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
                Abrir Telegram
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}
