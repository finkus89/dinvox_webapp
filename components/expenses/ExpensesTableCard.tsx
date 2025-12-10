// webapp/components/expenses/ExpensesTableCard.tsx
// -----------------------------------------------------------------------------
// Tarjeta "Registros de gastos" en Dinvox.
//
// RESPONSABILIDADES DEL COMPONENTE:
// - Llamar al endpoint real `/api/expenses` con:
//      • from (YYYY-MM-DD)
//      • to   (YYYY-MM-DD)
//      • category ("all" o id de categoría)
// - Reutilizar los mismos filtros que SummaryCard:
//      • Filtro de período (PeriodFilter + PeriodState de lib/dinvox/periods)
//      • DateRangePicker cuando el usuario selecciona "range"
//      • Filtro de categorías (CategoryFilter)
// - Mostrar un loading overlay mientras se cargan datos.
// - Mostrar mensaje de error si falla la API.
// - Mostrar tabla con scroll interno, ordenada por fecha descendente
//   (el backend ya devuelve orden descendente por expense_date).
// -----------------------------------------------------------------------------

"use client";

import { useEffect, useMemo, useState } from "react";
import PeriodFilter, {
  PeriodFilterValue,
} from "@/components/filters/PeriodFilter";
import DateRangePicker from "@/components/filters/DateRangePicker";
import CategoryFilter from "@/components/filters/CategoryFilter";
import {
  PeriodState,
  getPeriodDates,
  formatDateHuman,
  formatDateShort,
} from "@/lib/dinvox/periods";
import { CATEGORIES } from "@/lib/dinvox/categories";
import type { CategoryId } from "@/lib/dinvox/categories";
import NewExpenseModal from "@/components/expenses/NewExpenseModal";
import DeleteConfirmModal from "@/components/expenses/DeleteConfirmModal";
import EditExpenseModal, {
  type EditableExpense,
} from "@/components/expenses/EditExpenseModal";

import {
  ApiExpense,
  formatAmount,
  formatAmountNoCurrency,
  exportExpensesToCSV,
} from "@/lib/dinvox/expenses-utils";
import { initPeriodState } from "@/lib/dinvox/period-initializer";

// Props opcionales para permitir que otra pantalla (ej. Dashboard)
// fije el rango inicial de fechas y la categoría al entrar a esta tarjeta.
interface ExpensesTableCardProps {
  initialFrom?: string;      // YYYY-MM-DD (opcional)
  initialTo?: string;        // YYYY-MM-DD (opcional)
  initialCategory?: string;  // "all" o un CategoryId (opcional)
  // Tipo de período inicial tal como venga de la URL.
  // Lo tratamos como string para no pelear con PeriodFilterValue aquí.
  initialPeriodType?: PeriodFilterValue;
}

// -----------------------------------------------------------------------------
// Componente principal
// -----------------------------------------------------------------------------
export default function ExpensesTableCard({
  initialFrom,
  initialTo,
  initialCategory,
  initialPeriodType,
}: ExpensesTableCardProps) {
  // =============================
  // ESTADO: filtros
  // =============================
  //Inicializacion de periodos
  const [period, setPeriod] = useState<PeriodState>(() =>
  initPeriodState(initialPeriodType, initialFrom, initialTo)
);

  const isRange = period.type === "range";
  // Filtro de categoría: "all" o un CategoryId ("comida", "transporte", etc.)
  // Si viene initialCategory desde la URL, la respetamos; si no, usamos "all".
  const [categoryFilter, setCategoryFilter] = useState<string>(
    initialCategory && initialCategory !== "all" ? initialCategory : "all"
  );
  // =============================
  // ESTADO: datos de la API
  // =============================
  const [expenses, setExpenses] = useState<ApiExpense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  // Modal "Nuevo gasto"
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  // ==== ESTADO PARA EDICIÓN ====
  const [editingExpense, setEditingExpense] = useState<ApiExpense | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // =============================
  // EFECTO: cargar datos reales
  // =============================
  useEffect(() => {
    // Si no hay rango definido, no hacemos nada
    if (!period.from || !period.to) return;

    const controller = new AbortController();

    async function fetchExpenses() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const params = new URLSearchParams({
          from: period.from,
          to: period.to,
        });

        if (categoryFilter && categoryFilter !== "all") {
          params.set("category", categoryFilter);
        }

        const res = await fetch(`/api/expenses?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || `Error HTTP ${res.status}`);
        }

        const data: ApiExpense[] = await res.json();

        setExpenses(data);
        // console.log("✅ Expenses desde API:", data);
      } catch (err: any) {
        if (err.name === "AbortError") {
          // petición cancelada al cambiar filtros o desmontar componente
          return;
        }
        console.error("Error al cargar gastos:", err);
        setLoadError(err.message || "Error al cargar los gastos.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchExpenses();

    return () => {
      controller.abort();
    };
  }, [period.from, period.to, categoryFilter, reloadKey]);

  // =============================
  // DERIVADOS
  // =============================
  const hasData = expenses.length > 0;
  const totalAmount = useMemo(
    () => expenses.reduce((acc, exp) => acc + exp.amount, 0),
    [expenses]
  );

  const currency = expenses[0]?.currency ?? "COP";
  const displayCurrency = currency || "COP";

  //funcion de borrar
async function handleDelete(id: string) {
  try {
    const res = await fetch(`/api/expenses/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || "Error al eliminar el gasto.");
    }

    // Recargar datos sin refrescar la página
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  } catch (err: any) {
    alert(err.message || "Error al eliminar.");
  }
}
  // Handler para botón de exportar
  function handleExportClick() {
    exportExpensesToCSV(expenses, currency);
  }

  // Cuando el usuario hace clic en una fila -> abrir modal de edición
  function handleRowClick(expense: ApiExpense) {
    setEditingExpense(expense);
    setIsEditOpen(true);
  }
  // =============================
  // RENDER
  // =============================
  return (
    <section
      className="
        rounded-3xl border border-white/10
        bg-gradient-to-br from-slate-700 via-slate-600 to-brand-500
        backdrop-blur-xl shadow-xl
        text-slate-100 p-4 sm:p-6 md:p-8
      "
    >
      {/* =======================================================================
      ENCABEZADO: título + info rango + total + FILTROS + BOTONES
      ======================================================================= */}
      <div
        className="
          grid 
          md:grid-cols-3 
          gap-6 
          mb-6
        "
      >
        {/* ------------------------------------------------------------
            Columna 1 — TEXTO
          ------------------------------------------------------------ */}
        <div className="col-span-3 md:col-span-1 flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Registros de gastos</h2>

          <p className="text-xs text-slate-200/85">
            {hasData ? (
              <>
                Mostrando{" "}
                <span className="font-semibold">
                  {expenses.length} gasto{expenses.length !== 1 && "s"}
                </span>{" "}
                entre{" "}
                <span className="font-semibold">{formatDateHuman(period.from)}</span>{" "}
                y{" "}
                <span className="font-semibold">{formatDateHuman(period.to)}</span>.
              </>
            ) : (
              <>
                No hay gastos registrados entre{" "}
                <span className="font-semibold">{formatDateHuman(period.from)}</span>{" "}
                y{" "}
                <span className="font-semibold">{formatDateHuman(period.to)}</span>.
              </>
            )}
          </p>

          {hasData && !loadError && (
            <p className="text-sm sm:text-base text-emerald-200/95 mt-1">
              Total en el período:{" "}
              <span className="font-bold text-emerald-100 text-xl">
                {formatAmount(totalAmount, currency)}
              </span>
            </p>
          )}

          {loadError && (
            <p className="text-[11px] text-red-100/90">
              {loadError || "Error al cargar los gastos."}
            </p>
          )}
        </div>

        {/* ------------------------------------------------------------
            Columna 2 — FILTROS (Período + Categoría)
          ------------------------------------------------------------ */}
        <div className="col-span-2 md:col-span-1 flex flex-col gap-3 md:max-w-sm">
          <PeriodFilter
            value={period.type}
            onChange={(newType) => {
              if (newType === "range") {
                setPeriod((prev) => ({ ...prev, type: newType }));
              } else {
                const { from, to } = getPeriodDates(newType);
                setPeriod({ type: newType, from, to });
              }
            }}
          />
          <CategoryFilter
            value={categoryFilter}
            onChange={(value) => setCategoryFilter(value)}
          />
        </div>

        {/* ------------------------------------------------------------
            Columna 3 — BOTONES (Nuevo gasto + export CSV)
          ------------------------------------------------------------ */}
        <div className=" mt-5    md:mt-5 col-span-1 flex flex-col items-start md:items-center md:justify-center w-auto gap-7">
          <button
            onClick={() => setIsNewExpenseOpen(true)}
            className="
              w-full md:w-[150px]
              bg-emerald-500/20 
              hover:bg-emerald-500/30
              text-emerald-100 
              font-semibold   
              px-3 py-1.5        /* más compacto en mobile */
              md:px-4 md:py-1.5   /* tamaño normal en desktop */
              rounded-xl 
              border border-emerald-400/20
              backdrop-blur
              transition
              flex items-center gap-2
              text-sm
            "
          >
            <span className="text-xl font-bold">+</span> Nuevo gasto
          </button>

          <button
            onClick={handleExportClick}
            className="
              w-full md:w-[150px] 
              bg-emerald-500/10
              hover:bg-emerald-500/20
              text-emerald-100
              font-medium
              px-3 py-1.5
              md:px-4 md:py-1.5
              rounded-xl
              border border-emerald-400/30
              backdrop-blur
              transition
              text-xs sm:text-sm
            "
          >
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Si el usuario eligió "range", mostramos el selector de fechas */}
      {isRange && (
        <div className="mb-4">
          <DateRangePicker
            from={period.from}
            to={period.to}
            onChangeFrom={(value) =>
              setPeriod((prev) => ({
                ...prev,
                from: value,
              }))
            }
            onChangeTo={(value) =>
              setPeriod((prev) => ({
                ...prev,
                to: value,
              }))
            }
          />
        </div>
      )}

      {/* =======================================================================
          TABLA
         ======================================================================= */}
      <div
        className="
          mt-4 rounded-2xl border border-white/15 bg-slate-900/30
          px-3 py-3 sm:px-4 sm:py-4 relative
        "
      >
        {/* Overlay de loading sobre la tabla */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-slate-900/60">
            <div className="flex flex-col items-center gap-2 text-xs sm:text-sm text-slate-100/90">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-100 border-t-transparent" />
              <span>Cargando gastos…</span>
            </div>
          </div>
        )}

        {hasData ? (
          <div className="max-h-80 overflow-y-auto">
            <table className="min-w-[500px] md:min-w-full text-xs sm:text-sm">
              <thead className="sticky top-0 bg-slate-900/80 backdrop-blur border-b border-white/10">
                <tr>
                  <th className="px-2 py-2 text-center font-semibold text-slate-100">
                      
                  </th>
                  <th className="px-2 py-2 text-left font-semibold text-slate-100">
                    Fecha
                  </th>
                  <th className="px-2 py-2 text-left font-semibold text-slate-100">
                    Categoría
                  </th>
                  <th className="px-2 py-2 text-right font-semibold text-slate-100">
                    Monto ({displayCurrency})
                  </th>
                  <th className="px-2 py-2 text-left font-semibold text-slate-100">
                    Nota
                  </th>
                </tr>
              </thead>

              <tbody>
                {expenses.map((exp) => {
                  const categoryCfg = CATEGORIES[exp.categoryId];
                  return (
                    <tr
                      key={exp.id}
                      onClick={() => handleRowClick(exp)}
                      className="border-b border-white/5 last:border-none hover:bg-slate-900/40 cursor-pointer"
                    >
                      {/* Eliminar  */}
                      <td className="px-2 py-2 align-top text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();           // <- no dispare la edición
                            setDeleteId(exp.id);
                          }}
                          className="text-red-300 hover:text-red-400 transition"
                          title="Eliminar este gasto"
                        >
                          🗑️
                        </button>
                      </td>
                      {/* Fecha */}
                      <td className="px-2 py-2 align-top whitespace-nowrap">
                        <span className="text-slate-100">
                          {formatDateShort(exp.date)}
                        </span>
                      </td>

                      {/* Categoría + color */}
                      <td className="px-2 py-2 align-top whitespace-nowrap">
                        {categoryCfg ? (
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: categoryCfg.color }}
                            />
                            <span className="text-slate-100">
                              {categoryCfg.label}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-100">{exp.categoryId}</span>
                        )}
                      </td>

                      {/* Monto */}
                      <td className="px-2 py-2 align-top text-right whitespace-nowrap">
                        <span className="font-semibold text-slate-50">
                          ${formatAmountNoCurrency(exp.amount)}
                        </span>
                      </td>

                      {/* Nota */}
                      <td className="px-2 py-2 align-top">
                        <span className="text-slate-200 whitespace-nowrap md:whitespace-normal">
                          {exp.note || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          !isLoading && (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-slate-200/80 text-center">
                No hay gastos para mostrar con los filtros seleccionados.
              </p>
            </div>
          )
        )}
      </div>
      
      {/* Modal de creación de nuevo gasto */}
      <NewExpenseModal
        open={isNewExpenseOpen}
        onClose={() => setIsNewExpenseOpen(false)}
        onSuccess={() => setReloadKey((prev) => prev + 1)}
      />
      {/* Modal de eliminacion de gasto */}
      <DeleteConfirmModal
        open={deleteId !== null}
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          await handleDelete(deleteId);
          setDeleteId(null);
        }}
      />
            {/* Modal de edición de gasto */}
      <EditExpenseModal
        open={isEditOpen}
        expense={editingExpense}
        onClose={() => {
          setIsEditOpen(false);
          setEditingExpense(null);
        }}
        onSaved={(updated: EditableExpense) => {
          // Actualizar la lista local cuando se guarda desde el modal
          setExpenses((prev) =>
            prev.map((exp) => (exp.id === updated.id ? updated : exp))
          );
        }}
      />

    </section>
  );
}
