// src/components/settings/AccountInfoCard.tsx
// -------------------------------------------
// AccountInfoCard (Settings > Tu cuenta)
//
// Objetivo (nuevo):
// - Mostrar la información básica del usuario.
// - En el bloque "Canal":
//    1) Mostrar el canal actual.
//    2) Permitir iniciar cambio de canal (abre modal de confirmación).
//    3) Si existe pending_channel:
//       - Mostrar "Cambio pendiente a: X"
//       - Botón "Continuar" -> redirige a /connect-{pending}
//       - Botón "Cancelar"  -> dispara acción para limpiar pending_channel
//
// Comportamiento adicional (nuevo):
// - Si pending_channel existe, el botón "Cambiar" se deshabilita para evitar
//   iniciar múltiples cambios en paralelo (reduce estados inconsistentes).
//
// Nota:
// - pendingChannel se trae desde el padre (SettingsPage) y se pasa como prop.
// - El modal lo implementamos después.

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ChangeChannelModal from "@/components/settings/ChangeChannelModal";


type Channel = "telegram" | "whatsapp";

type AccountInfoCardProps = {
  name?: string;
  email?: string;
  phone?: string;

  channel?: string;
  pendingChannel?: string | null;

  language?: string;
  currency?: string;
  country?: string;
  createdAt?: string;

  onCancelPending?: () => Promise<void> | void;
};

export default function AccountInfoCard({
  name = "—",
  email = "—",
  phone = "—",
  channel = "—",
  pendingChannel = null,
  language = "—",
  currency = "—",
  country = "—",
  createdAt = "—",
  onCancelPending,
}: AccountInfoCardProps) {
  const router = useRouter();

  // Modal (lo construiremos después).
  const [isChangeChannelOpen, setIsChangeChannelOpen] = useState(false);

  const normalizedChannel = useMemo<Channel | null>(() => {
    if (channel === "telegram" || channel === "whatsapp") return channel;
    return null;
  }, [channel]);

  const normalizedPendingFromProps = useMemo<Channel | null>(() => {
    if (pendingChannel === "telegram" || pendingChannel === "whatsapp") return pendingChannel;
    return null;
  }, [pendingChannel]);

  // ✅ Optimistic UI: si el usuario cancela, ocultamos el pending localmente
  // aunque el padre aún no haya recargado datos.
  const [pendingLocal, setPendingLocal] = useState<Channel | null>(normalizedPendingFromProps);

  useEffect(() => {
    setPendingLocal(normalizedPendingFromProps);
  }, [normalizedPendingFromProps]);

  const handleContinuePending = () => {
    if (!pendingLocal) return;
    router.push(pendingLocal === "whatsapp" ? "/connect-whatsapp" : "/connect-telegram");
  };

  const handleCancelPending = async () => {
    try {
      // Optimistic: ocultar inmediatamente
      setPendingLocal(null);

      if (onCancelPending) {
        await onCancelPending();
        return;
      }

      console.warn("onCancelPending no está conectado aún (pendiente endpoint).");
    } catch (e) {
      console.error("Error cancelando cambio pendiente:", e);
      // Si falló, restauramos el pending visual para no mentirle al usuario
      setPendingLocal(normalizedPendingFromProps);
    }
  };

  const handleOpenChangeModal = () => {
    setIsChangeChannelOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoRow label="Nombre" value={name} />
        <InfoRow label="Correo electrónico" value={email} />
        <InfoRow label="Teléfono" value={phone} />

        <ChannelRow
          channelValue={normalizedChannel ? normalizedChannel : String(channel)}
          pendingChannel={pendingLocal}
          onOpenChangeModal={handleOpenChangeModal}
          onContinuePending={handleContinuePending}
          onCancelPending={handleCancelPending}
        />

        <InfoRow label="Idioma" value={language} />
        <InfoRow label="Moneda" value={currency} />
        <InfoRow label="País" value={country} />
        <InfoRow label="Fecha de registro" value={createdAt} />
      </div>

      {/* Modal de cambio de canal  */}
      {isChangeChannelOpen && normalizedChannel && (
        <ChangeChannelModal
          open={isChangeChannelOpen}
          onClose={() => setIsChangeChannelOpen(false)}
          currentChannel={normalizedChannel}
        />
      )}

    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="
        rounded-xl border border-white/10
        bg-slate-900/30
        px-4 py-3
        flex flex-col gap-1
      "
    >
      <span className="text-[11px] uppercase tracking-wide text-slate-300/80">
        {label}
      </span>
      <span className="text-sm font-medium text-slate-100">{value}</span>
    </div>
  );
}

function ChannelRow({
  channelValue,
  pendingChannel,
  onOpenChangeModal,
  onContinuePending,
  onCancelPending,
}: {
  channelValue: string;
  pendingChannel: Channel | null;
  onOpenChangeModal: () => void;
  onContinuePending: () => void;
  onCancelPending: () => void;
}) {
  const hasPending = Boolean(pendingChannel);

  return (
    <div
      className="
        rounded-xl border border-white/10
        bg-slate-900/30
        px-4 py-3
        flex flex-col gap-2
      "
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[11px] uppercase tracking-wide text-slate-300/80">
            Canal
          </span>
          <div className="text-sm font-medium text-slate-100 truncate">
            {channelValue}
          </div>
        </div>

        {/* ✅ "Cambiar" deshabilitado si hay pending */}
        <button
          type="button"
          onClick={onOpenChangeModal}
          disabled={Boolean(pendingChannel)}
          className={`
            shrink-0 rounded-lg border border-white/15 bg-white/5
            px-3 py-1.5 text-xs font-medium text-white/90
            hover:bg-white/10 transition
            ${pendingChannel ? "opacity-50 cursor-not-allowed hover:bg-white/5" : ""}
          `}
        >
          Cambiar
        </button>

      </div>

      {pendingChannel && (
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <div className="text-xs text-white/80">
            Cambio pendiente a:{" "}
            <span className="font-semibold text-white">{pendingChannel}</span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onContinuePending}
              className="
                rounded-lg bg-white/15 px-3 py-1.5
                text-xs font-medium text-white
                hover:bg-white/20 transition
              "
            >
              Continuar
            </button>

            <button
              type="button"
              onClick={onCancelPending}
              className="
                rounded-lg border border-white/15 bg-transparent
                px-3 py-1.5 text-xs font-medium text-white/80
                hover:bg-white/5 transition
              "
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
