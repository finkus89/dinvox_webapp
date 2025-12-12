// webapp/components/expenses/EditExpenseModal.tsx
// -----------------------------------------------------------------------------
// Modal para EDITAR un gasto existente en Dinvox.
//
// RESPONSABILIDADES:
// - Recibir un gasto (ApiExpense) y mostrar sus campos en un formulario.
// - Permitir modificar fecha, categoría, monto y nota.
// - Enviar PATCH a `/api/expenses/[id]`.
// - Notificar arriba con onSaved(updatedExpense) cuando guarda ok.
// -----------------------------------------------------------------------------

"use client";

import { useEffect, useState } from "react";
import { CATEGORIES, type CategoryId } from "@/lib/dinvox/categories";

//obtine fecha d ehoy para limitar fecha 
function getTodayLocalStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Tipo mínimo que necesitamos del gasto
export type EditableExpense = {
  id: string;
  date: string;          // "YYYY-MM-DD"
  categoryId: CategoryId;
  amount: number;
  currency: string;
  note: string;
};

interface EditExpenseModalProps {
  open: boolean;
  expense: EditableExpense | null;
  onClose: () => void;
  onSaved: (updated: EditableExpense) => void;
}

export default function EditExpenseModal({
  open,
  expense,
  onClose,
  onSaved,
}: EditExpenseModalProps) {
  // ---------------------------------------------------------------------------
  // ESTADO LOCAL DEL FORMULARIO
  // ---------------------------------------------------------------------------
  const [form, setForm] = useState({
    date: "",
    category: "",
    amount: "",
    note: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayStr = getTodayLocalStr();
  // Cuando cambie el gasto a editar, rellenamos el formulario
  useEffect(() => {
    if (!open || !expense) return;

    setForm({
      date: expense.date ?? "",
      category: expense.categoryId ?? "",
      amount: String(expense.amount ?? ""),
      note: expense.note ?? "",
    });
    setError(null);
  }, [open, expense]);

  if (!open || !expense) {
    return null;
  }

  // ---------------------------------------------------------------------------
  // HANDLER: guardar cambios (PATCH)
  // ---------------------------------------------------------------------------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!expense) return;

     // Validación rápida de fecha futura (igual criterio que NewExpenseModal)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!form.date || !dateRegex.test(form.date)) {
      setError("Selecciona una fecha válida.");
      return;
    }

    if (form.date > todayStr) {
      setError("La fecha no puede ser futura.");
      return;
    }


    // Validación simple de categoría
    if (!form.category) {
      setError("Selecciona una categoría válida.");
      return;
    }
    if (!(form.category in CATEGORIES)) {
      setError("Categoría inválida.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Normalizar monto (quitando separadores de miles y espacios)
      const rawAmount = form.amount
        .replace(/\s+/g, "")   // quitar espacios
        .replace(/\./g, "")    // puntos de miles
        .replace(",", ".");    // coma a punto

      const amountNumber = Number(rawAmount) || 0;

      if (form.amount.length > 12) {
        setError("El monto es demasiado grande.");
        setIsSaving(false);
        return;
      }
      if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
        setError("El monto debe ser un número positivo.");
        setIsSaving(false);
        return;
      }

      if (form.note.length > 200) {
        setError("La nota no puede superar 200 caracteres.");
        setIsSaving(false);
        return;
      }

      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountNumber,
          categoryId: form.category,
          note: form.note ?? null,
          date: form.date || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Error al guardar los cambios.");
      }

      const data = await res.json();
      const updated = (data.expense ?? data) as EditableExpense;

      onSaved(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar la edición.");
    } finally {
      setIsSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // RENDER DEL MODAL
  // ---------------------------------------------------------------------------
  return (
    <div
      className="
        fixed inset-0 z-40
        flex items-center justify-center
        bg-slate-900/70 backdrop-blur-sm
      "
      aria-modal="true"
      role="dialog"
    >
      <div
        className="
          w-full max-w-md
          mx-4
          rounded-3xl
          border border-white/15
          bg-gradient-to-br from-slate-700 via-slate-600 to-slate-500
          shadow-2xl
          text-slate-100
        "
      >
        {/* HEADER DEL MODAL (igual estructura que Nuevo gasto) */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-lg font-semibold">Editar gasto</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 text-sm"
            disabled={isSaving}
          >
            Cerrar
          </button>
        </div>

        <div className="px-5 pb-5">
          {/* Mensaje de error global (mismo estilo que NewExpenseModal) */}
          {error && (
            <div className="mb-3 rounded-xl bg-red-500/10 border border-red-400/40 px-3 py-2 text-xs text-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* FECHA */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-200">
                Fecha
              </label>
              <input
                type="date"
                value={form.date}
                max={todayStr} // ← bloquea fechas futuras en el selector
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, date: e.target.value }))
                }
                className="
                  w-full rounded-xl border border-white/10
                  bg-slate-900/60 px-3 py-2
                  text-sm text-slate-100
                  focus:outline-none focus:ring-2 focus:ring-emerald-400/70
                  [&::-webkit-calendar-picker-indicator]:invert
                  [&::-webkit-calendar-picker-indicator]:opacity-80
                "
              />
            </div>

            {/* CATEGORÍA */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-200">
                Categoría
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, category: e.target.value }))
                }
                className="
                  w-full rounded-xl border border-white/10
                  bg-slate-900/60 px-3 py-2
                  text-sm text-slate-100
                  focus:outline-none focus:ring-2 focus:ring-emerald-400/70
                "
              >
                <option value="">Selecciona una categoría</option>
                {Object.entries(CATEGORIES).map(([id, cfg]) => (
                  <option key={id} value={id}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>

            {/* MONTO */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-200">
                Monto ({expense.currency})
              </label>
              <input
                type="text"
                placeholder="Ej: 25000"
                value={form.amount}
                maxLength={12}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, amount: e.target.value }))
                }
                className="
                  w-full rounded-xl border border-white/10
                  bg-slate-900/60 px-3 py-2
                  text-sm text-slate-100
                  focus:outline-none focus:ring-2 focus:ring-emerald-400/70
                "
              />
            </div>

            {/* NOTA */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-200">
                Nota (opcional)
              </label>
              <textarea
                rows={3}
                maxLength={200}
                placeholder="Ej: Ajuste de categoría o corrección de nota"
                value={form.note}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, note: e.target.value }))
                }
                className="
                  w-full rounded-xl border border-white/10
                  bg-slate-900/60 px-3 py-2
                  text-sm text-slate-100
                  resize-none
                  focus:outline-none focus:ring-2 focus:ring-emerald-400/70
                "
              />
            </div>

            {/* BOTONES (alineados con NewExpenseModal) */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
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
                type="submit"
                disabled={isSaving}
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
                {isSaving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
