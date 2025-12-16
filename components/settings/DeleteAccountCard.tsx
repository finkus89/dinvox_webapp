// src/components/settings/DeleteAccountCard.tsx
// ---------------------------------------------
// Card de acción destructiva: Eliminar cuenta.
// - Solo UI (sin lógica real todavía).
// - Texto claro y advertencias.
// - Preparada para conectar API/confirmaciones en el futuro.
// - El contenedor principal y el título los maneja SettingsSection.

"use client";

export default function DeleteAccountCard() {
  return (
    <div
      className="
        rounded-xl border border-red-400/30
        bg-red-900/25
        p-4 sm:p-6
        text-slate-100
      "
    >
      <p className="text-sm text-slate-200/85 mb-4">
        Esta acción eliminará permanentemente tu cuenta y todos tus datos
        asociados en Dinvox. No podrás recuperar esta información.
      </p>

      <p className="text-xs text-slate-300/80 mb-6">
        Si continúas, perderás el acceso al historial de gastos y a cualquier
        configuración asociada.
      </p>

      <button
        type="button"
        disabled
        className="
          inline-flex items-center justify-center
          rounded-xl px-4 py-2
          text-sm font-semibold
          bg-red-600/60 text-red-100
          border border-red-400/40
          cursor-not-allowed
          opacity-80
        "
        title="Función no disponible aún"
      >
        Eliminar mi cuenta
      </button>

      <p className="mt-3 text-[11px] text-red-200/70">
        * Esta función estará disponible próximamente.
      </p>
    </div>
  );
}
