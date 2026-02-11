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

import { useEffect, useMemo, useState } from "react"; // 🆕 useMemo
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
  date: string; // "YYYY-MM-DD"
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

  // 🆕 locale del usuario (para consistencia con NewExpenseModal)
  // Ej: "es-CO", "es-ES", "en-US"
  language?: string;
}

export default function EditExpenseModal({
  open,
  expense,
  onClose,
  onSaved,
  language: languageProp, // 🆕
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

  // 🆕 moneda del gasto (si expense viene null, fallback seguro)
  const currency = (expense?.currency ?? "COP").toUpperCase();

  // 🆕 locale del usuario (fallback seguro)
  const language = languageProp ?? "en-US";

  // 🆕 decimales automáticos por moneda (Intl)
  const currencyDecimals: number = useMemo((): number => {
    if (!currency) return 2;

    try {
      const fmt = new Intl.NumberFormat(language, {
        style: "currency",
        currency,
      });

      const digits = fmt.resolvedOptions().maximumFractionDigits; // ej: 0, 2, 3
      return typeof digits === "number" ? digits : 2;
    } catch {
      return 2;
    }
  }, [currency, language]);

  const usesZeroDecimals = currencyDecimals === 0;

  // 🆕 parse robusto: NO borrar puntos a ciegas (eso rompe 8.60)
  function parseAmount(raw: string): number {
    const s = raw.trim().replace(/\s+/g, "");

    // Si la moneda es de 0 decimales (ej: COP/CLP/JPY),
    // permitimos puntos/comedas como separadores de miles, pero al final dejamos solo dígitos.
    if (usesZeroDecimals) {
      const digitsOnly = s.replace(/[^\d]/g, "");
      const n = Number(digitsOnly);
      return Number.isFinite(n) ? n : NaN;
    }

    // Para monedas con decimales:
    // - permitimos "8.60" o "8,60"
    // - normalizamos coma -> punto
    const normalized = s.replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : NaN;
  }

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

      const amountNumber = parseAmount(form.amount); // 🆕
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

      // 🆕 validación: máximo decimales permitidos por la moneda
      if (!usesZeroDecimals) {
        const decimals = (String(form.amount).split(/[.,]/)[1] ?? "").length;
        if (decimals > currencyDecimals) {
          setError(`Máximo ${currencyDecimals} decimales para esta moneda.`);
          setIsSaving(false);
          return;
        }
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
              <label className="text-xs font-medium text-slate-200">Fecha</label>
              <input
                type="date"
                value={form.date}
                max={todayStr}
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
              <label className="text-xs font-medium text-slate-200">Categoría</label>
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
                inputMode="decimal" // 🆕 ayuda en móvil para teclado decimal
                placeholder={usesZeroDecimals ? "Ej: 25000" : "Ej: 8.60"} // 🆕
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

            {/* BOTONES */}
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
