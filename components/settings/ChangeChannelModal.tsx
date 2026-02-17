"use client";

/*
  ChangeChannelModal
  -------------------
  Modal que confirma el cambio de canal del usuario.

  ¿Qué hace?

  1) Recibe el canal actual (telegram | whatsapp).
  2) Calcula automáticamente el nuevo canal (el opuesto).
  3) Muestra un mensaje contextual según el cambio.
  4) Al confirmar:
       - Llama al endpoint /api/settings/start-channel-change
       - El backend:
            • setea users.pending_channel
            • genera un nuevo token en la BD
       - Si todo es OK:
            • Redirige a /connect-{nuevo canal}
  5) Maneja loading y errores básicos.

  IMPORTANTE:
  - No toca directamente Supabase.
  - No genera token en frontend.
  - Solo habla con el endpoint.
*/

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Channel = "telegram" | "whatsapp";

/* -------------------------------------------
   Helper: nombre bonito del canal
--------------------------------------------*/
function prettyChannel(ch: Channel) {
  return ch === "telegram" ? "Telegram" : "WhatsApp";
}

export default function ChangeChannelModal({
  open,
  onClose,
  currentChannel,
}: {
  open: boolean;
  onClose: () => void;
  currentChannel: Channel;
}) {
  const router = useRouter();

  // Estado interno
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* -------------------------------------------
     1️⃣ Determinar nuevo canal automáticamente
     Si estoy en Telegram → cambio a WhatsApp
     Si estoy en WhatsApp → cambio a Telegram
  --------------------------------------------*/
  const newChannel = useMemo<Channel>(() => {
    return currentChannel === "telegram" ? "whatsapp" : "telegram";
  }, [currentChannel]);

  /* -------------------------------------------
     2️⃣ Texto dinámico según el canal
  --------------------------------------------*/
  const title = `Cambiar a ${prettyChannel(newChannel)}`;

  const description = useMemo(() => {
    if (currentChannel === "telegram") {
      return "Vas a dejar de usar Telegram y pasar a WhatsApp. Después tendrás que reconectar tu cuenta en WhatsApp para seguir registrando gastos.";
    }
    return "Vas a dejar de usar WhatsApp y pasar a Telegram. Después tendrás que reconectar tu cuenta en Telegram para seguir registrando gastos.";
  }, [currentChannel]);

  /* -------------------------------------------
     3️⃣ Confirmar cambio
     - Llama endpoint
     - Si ok → redirige a /connect-{canal}
  --------------------------------------------*/
  async function handleConfirm() {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/settings/start-channel-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newChannel }),
      });

      // Intentar parsear JSON (si falla, sabemos que el endpoint no respondió bien)
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "No se pudo iniciar el cambio.");
        return;
      }

      /*
        En este punto:
        - pending_channel ya está seteado
        - token ya fue regenerado en la BD
      */

      // Redirigir a la pantalla de conexión del nuevo canal
      router.push(newChannel === "whatsapp" ? "/connect-whatsapp" : "/connect-telegram");

      onClose();
    } catch {
      setError("Error de red. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  /* -------------------------------------------
     4️⃣ Si el modal no está abierto, no renderiza nada
  --------------------------------------------*/
  if (!open) return null;

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-slate-900/70 backdrop-blur-sm
      "
      aria-modal="true"
      role="dialog"
      // ✅ ARREGLO: cerrar SOLO si el click ocurre en el backdrop (no dentro del card)
      onMouseDown={(e) => {
        if (loading) return;
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="
          relative z-10
          w-full max-w-md
          mx-4
          rounded-3xl
          border border-white/15
          bg-gradient-to-br from-slate-700 via-slate-600 to-slate-500
          shadow-2xl
          text-slate-100
        "
      >
        {/* HEADER DEL MODAL */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-slate-100 text-sm transition"
            disabled={loading}
          >
            Cerrar
          </button>
        </div>

        <div className="px-5 pb-5">
          {/* Descripción contextual */}
          <p className="text-sm text-slate-200/90">{description}</p>

          {/* Resumen visual del cambio */}
          <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <p className="text-xs text-slate-200/90">
              Canal actual:{" "}
              <span className="font-semibold text-slate-50">
                {prettyChannel(currentChannel)}
              </span>
              <br />
              Nuevo canal:{" "}
              <span className="font-semibold text-slate-50">
                {prettyChannel(newChannel)}
              </span>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 rounded-xl bg-red-500/10 border border-red-400/40 px-3 py-2 text-xs text-red-100">
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="
                rounded-xl border border-white/15
                bg-slate-800/70 px-4 py-2
                text-xs sm:text-sm
                text-slate-100
                hover:bg-slate-700/80
                disabled:opacity-60 disabled:cursor-not-allowed
                transition
              "
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="
                inline-flex items-center justify-center gap-2
                rounded-xl border border-emerald-400/40
                bg-emerald-500/80 px-4 py-2
                text-xs sm:text-sm
                font-semibold text-slate-900
                hover:bg-emerald-400
                disabled:opacity-60 disabled:cursor-not-allowed
                transition
              "
            >
              {loading ? "Procesando..." : "Confirmar cambio"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
