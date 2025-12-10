"use client";

type Props = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteConfirmModal({ open, onCancel, onConfirm }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-6 w-80 shadow-xl text-slate-100">
        <h3 className="text-lg font-semibold mb-3">¿Eliminar gasto?</h3>
        <p className="text-sm text-slate-300 mb-6">
          Esta acción no se puede deshacer.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-600/40 hover:bg-slate-600/60 transition text-sm"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-500/40 hover:bg-red-500/60 border border-red-400/20 transition text-sm font-semibold"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
