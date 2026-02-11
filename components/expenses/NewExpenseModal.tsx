// webapp/components/expenses/NewExpenseModal.tsx
// -----------------------------------------------------------------------------
// Modal para crear un nuevo gasto manual en Dinvox.
//
// RESPONSABILIDADES:
// - Mostrar un overlay modal cuando `open === true`.
// - Formulario con:
//     • Fecha (date → expense_date en BD, formato YYYY-MM-DD)
//     • Categoría (CategoryId de CATEGORIES)
//     • Monto (number > 0, en la moneda del usuario)
//     • Nota (opcional)
// - Validar datos básicos antes de enviar.
// - Hacer POST a `/api/expenses` con el payload:
//     { date, categoryId, amount, note }
// - Mostrar estados de loading y errores.
// - Cerrar al guardar con éxito (y opcionalmente notificar vía onCreated).
// -----------------------------------------------------------------------------

"use client";

import { useEffect, useMemo, useState } from "react"; // 🆕 useMemo
import { CATEGORIES, type CategoryId } from "@/lib/dinvox/categories";

// Props públicas del modal
type NewExpenseModalProps = {
  open: boolean;
  onClose: () => void;
  // Opcional: callback para que el padre pueda refrescar la tabla
  onCreated?: () => void;
  onSuccess?: () => void;

  // 🆕 para soportar decimales y UX según moneda/idioma
  currency?: string; // ej: "COP" | "EUR"
  language?: string; // ej: "es-CO" | "es-ES"
};

// Helper para “hoy” en zona local
function getTodayLocalStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`; // YYYY-MM-DD
}

// Estado interno del formulario
type FormState = {
  date: string; // "YYYY-MM-DD"
  categoryId: string; // CategoryId como string
  amount: string; // lo manejamos como string en el input
  note: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

export default function NewExpenseModal({
  open,
  onClose,
  onCreated,
  onSuccess,
  currency: currencyProp, // 🆕
  language: languageProp, // 🆕
}: NewExpenseModalProps) {
  // =============================
  // ESTADO
  // =============================

  const [form, setForm] = useState<FormState>({
    date: "",
    categoryId: "",
    amount: "",
    note: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const todayStr = getTodayLocalStr();

  // 🆕 defaults seguros (por si no pasas props todavía)
  // NOTA: evitamos caer silenciosamente en COP si no llega currencyProp.
  const currency = currencyProp ? currencyProp.toUpperCase() : null;
  const language = languageProp ?? "es-CO";
  const isCurrencyReady = !!currency; // 🆕 evita UX confusa si no llega moneda

  // 🆕 reglas de decimales por moneda (automático con Intl)
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
      // fallback seguro si la moneda no es válida ISO
      return 2;
    }
  }, [currency, language]);

  const usesZeroDecimals = currencyDecimals === 0;

  // Step para el input
  const amountStep = usesZeroDecimals ? "1" : "0.01";

  // Cuando se abre el modal, inicializamos el formulario (fecha = hoy)
  useEffect(() => {
    if (!open) return;

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    setForm({
      date: `${yyyy}-${mm}-${dd}`,
      categoryId: "",
      amount: "",
      note: "",
    });
    setErrors({});
    setSubmitError(null);
    setIsSubmitting(false);
  }, [open]);

  // =============================
  // HANDLERS
  // =============================

  function handleChange<K extends keyof FormState>(field: K, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    // limpiar error del campo al cambiar
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  }

  // 🆕 parse robusto para coma decimal (es-ES) y espacios
  function parseAmount(raw: string): number {
    const cleaned = raw.trim().replace(/\s+/g, "").replace(",", "."); // coma -> punto
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }

  function validateForm(): boolean {
    const newErrors: FormErrors = {};

    // Fecha
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!form.date || !dateRegex.test(form.date)) {
      newErrors.date = "Selecciona una fecha válida.";
    }
    // fecha futura
    if (form.date > todayStr) {
      newErrors.date = "La fecha no puede ser futura.";
    }

    // Categoría
    if (!form.categoryId) {
      newErrors.categoryId = "Selecciona una categoría.";
    } else if (!(form.categoryId in CATEGORIES)) {
      newErrors.categoryId = "Categoría inválida.";
    }

    // 🆕 si no hay moneda, bloqueamos guardar (esto evita que se guarde con reglas incorrectas)
    if (!isCurrencyReady) {
      newErrors.amount =
        "No se pudo cargar la moneda del usuario. Cierra y vuelve a abrir.";
    }

    // Monto
    const amountNum = parseAmount(form.amount); // 🆕
    if (!form.amount) {
      newErrors.amount = "Ingresa un monto.";
    } else if (!Number.isFinite(amountNum) || amountNum <= 0) {
      newErrors.amount = "El monto debe ser un número positivo.";
    }

    // 🆕 validación: máximo decimales permitidos por la moneda
    if (Number.isFinite(amountNum)) {
      const decimals = (String(form.amount).split(/[.,]/)[1] ?? "").length;
      if (decimals > currencyDecimals) {
        newErrors.amount = `Máximo ${currencyDecimals} decimales para esta moneda.`;
      }
    }

    if (form.amount.length > 12) {
      newErrors.amount = "El monto es demasiado grande.";
    }

    // Nota
    if (form.note.length > 200) {
      newErrors.note = "La nota no puede superar 200 caracteres.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const amountNum = parseAmount(form.amount); // 🆕
      if (!Number.isFinite(amountNum)) {
        throw new Error("Monto inválido.");
      }

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: form.date,
          categoryId: form.categoryId,
          amount: amountNum,
          note: form.note || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Error HTTP ${res.status}`);
      }

      onCreated?.();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("Error al crear gasto:", err);
      setSubmitError(
        err.message || "Ocurrió un error al guardar el gasto. Inténtalo de nuevo."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // =============================
  // RENDER
  // =============================

  if (!open) return null;

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
        {/* HEADER DEL MODAL */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-lg font-semibold">Nuevo gasto</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 text-sm"
            disabled={isSubmitting}
          >
            Cerrar
          </button>
        </div>

        <div className="px-5 pb-5">
          {/* Mensaje de error global */}
          {submitError && (
            <div className="mb-3 rounded-xl bg-red-500/10 border border-red-400/40 px-3 py-2 text-xs text-red-100">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* FECHA */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-200">Fecha</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => handleChange("date", e.target.value)}
                max={todayStr}
                className="
                  w-full rounded-xl border border-white/10
                  bg-slate-900/60 px-3 py-2
                  text-sm text-slate-100
                  focus:outline-none focus:ring-2 focus:ring-emerald-400/70
                  [&::-webkit-calendar-picker-indicator]:invert
                  [&::-webkit-calendar-picker-indicator]:opacity-80
                "
              />
              {errors.date && (
                <p className="text-[11px] text-red-200">{errors.date}</p>
              )}
            </div>

            {/* CATEGORÍA */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-200">Categoría</label>
              <select
                value={form.categoryId}
                onChange={(e) => handleChange("categoryId", e.target.value)}
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
              {errors.categoryId && (
                <p className="text-[11px] text-red-200">{errors.categoryId}</p>
              )}
            </div>

            {/* MONTO */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-200">
                Monto ({currency ?? "—"}) {/* 🆕 ayuda visual */}
              </label>
              <input
                type="number"
                inputMode="decimal" // 🆕 (antes numeric)
                min="0"
                step={amountStep} // 🆕 (antes 100)
                placeholder={usesZeroDecimals ? "Ej: 25000" : "Ej: 8.60"} // 🆕
                value={form.amount}
                maxLength={12}
                onChange={(e) => handleChange("amount", e.target.value)}
                disabled={!isCurrencyReady || isSubmitting} // 🆕 evita caer en COP silencioso
                className="
                  w-full rounded-xl border border-white/10
                  bg-slate-900/60 px-3 py-2
                  text-sm text-slate-100
                  focus:outline-none focus:ring-2 focus:ring-emerald-400/70
                  disabled:opacity-60 disabled:cursor-not-allowed
                "
              />
              {errors.amount && (
                <p className="text-[11px] text-red-200">{errors.amount}</p>
              )}
            </div>

            {/* NOTA */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-200">
                Nota (opcional)
              </label>
              <textarea
                rows={3}
                maxLength={200}
                placeholder="Ej: Almuerzo con amigos en tal lugar"
                value={form.note}
                onChange={(e) => handleChange("note", e.target.value)}
                className="
                  w-full rounded-xl border border-white/10
                  bg-slate-900/60 px-3 py-2
                  text-sm text-slate-100
                  resize-none
                  focus:outline-none focus:ring-2 focus:ring-emerald-400/70
                "
              />
              {errors.note && (
                <p className="text-[11px] text-red-200">{errors.note}</p>
              )}
            </div>

            {/* BOTONES */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
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
                disabled={isSubmitting || !isCurrencyReady} // 🆕 evita guardar sin moneda
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
                {isSubmitting ? "Guardando..." : "Guardar gasto"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
