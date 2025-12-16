// src/components/settings/AccountInfoCard.tsx
// -------------------------------------------
// Contenido de información básica de la cuenta Dinvox.
// UI pura (sin título ni contenedor principal).
// El contenedor y el título los maneja SettingsSection.

"use client";

type AccountInfoCardProps = {
  name?: string;
  email?: string;
  phone?: string;
  channel?: string;
  language?: string;
  currency?: string;
  country?: string;
  createdAt?: string;
};

export default function AccountInfoCard({
  name = "—",
  email = "—",
  phone = "—",
  channel = "—",
  language = "—",
  currency = "—",
  country = "—",
  createdAt = "—",
}: AccountInfoCardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <InfoRow label="Nombre" value={name} />
      <InfoRow label="Correo electrónico" value={email} />
      <InfoRow label="Teléfono" value={phone} />
      <InfoRow label="Canal" value={channel} />
      <InfoRow label="Idioma" value={language} />
      <InfoRow label="Moneda" value={currency} />
      <InfoRow label="País" value={country} />
      <InfoRow label="Fecha de registro" value={createdAt} />
    </div>
  );
}

/* -------------------------------------------
   Subcomponente: fila de información
--------------------------------------------*/
function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
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
      <span className="text-sm font-medium text-slate-100">
        {value}
      </span>
    </div>
  );
}
