// /api/expenses/route.ts
// ---------------------------------------------------------
// Dinvox | /api/expenses
//
// Endpoint para obtener registros individuales (NO agregados)
// del usuario autenticado.
//
// CUÁNDO USAR ESTE ENDPOINT:
// - Cards de gráficos que necesitan registros crudos por rango:
//    • Tercios del mes (MonthThirdsCard)              -> view=analytics
//    • Ritmo del mes (MonthRhythmCard)               -> view=analytics
//    • Evolución mensual (MonthlyEvolution/LineChart)-> view=analytics
// - Tabla de gastos (ExpensesTableCard)              -> view=full (default)
//
// CUÁNDO NO USAR:
// - Resúmenes / banners / insights agregados
//   (eso va por /api/summary y/o RPCs).
//
// ---------------------------------------------------------
// PARAMS (query):
// - from: YYYY-MM-DD  (inicio del rango)   [requerido]
// - to:   YYYY-MM-DD  (fin del rango)      [requerido]
//
// - view (opcional): "full" | "analytics"                     🆕
//    • default: "full"  (NO rompe consumers existentes)
//    • "full": para tabla/edición -> incluye note e id
//    • "analytics": para gráficos -> payload liviano:
//         - NO incluye note
//         - NO incluye id
//
// - transaction_type (opcional): "expense" | "income"         🆕 (prep ingresos)
//    • default: "expense" (mantiene comportamiento actual)
//    • Recomendación: la UI lo envía siempre para evitar drift.
//
// - category (opcional): id de categoría ("comida", "ropa", etc.)      ✅ legacy (single)
// - categories (opcional): CSV de categorías ("ocio,comida,servicios") 🆕 multi (solo tabla)
//
// PRIORIDAD de filtros de categoría:
//   1) categories (multi)  -> IN (...)
//   2) category (single)   -> EQ (...)
//   3) nada / "all"        -> sin filtro
//
// FILTRADO POR FECHA:
// - Usa `expense_date` (fecha local normalizada) para UI.
// - NO usa created_at (UTC).
//
// ---------------------------------------------------------
// RESPUESTA:
//
// view=full (default):
//   [
//     { id, date, categoryId, amount, currency, note },
//     ...
//   ]
//
// view=analytics:
//   [
//     { date, categoryId, amount, currency },
//     ...
//   ]
//
// Nota currency:
// - Hoy viene del perfil (tabla users) para mantener compatibilidad y
//   porque varias cards lo usan como fallback.
// - Más adelante, si quieres optimizar aún más, se puede omitir currency
//   en view=analytics (si AppContext es 100% confiable).
// ---------------------------------------------------------

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { guardCanMutate } from "@/lib/dinvox/guard-can-mutate";

type ViewParam = "full" | "analytics";

export async function GET(request: Request) {
  try {
    // -----------------------------------------
    // 1) Leer parámetros
    // -----------------------------------------
    const { searchParams } = new URL(request.url);

    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // view: default "full"
    const viewParam = (searchParams.get("view") ?? "").trim() as ViewParam;
    const view: ViewParam = viewParam === "analytics" ? "analytics" : "full";

    // transaction_type: default "expense"
    const transactionTypeParam = (searchParams.get("transaction_type") ?? "").trim();
    const transaction_type =
      transactionTypeParam === "income" || transactionTypeParam === "expense"
        ? transactionTypeParam
        : "expense";

    // ✅ Filtro legacy (single)
    const category = searchParams.get("category"); // opcional

    // 🆕 Filtro multi (CSV)
    const categoriesParam = searchParams.get("categories"); // opcional
    const categories =
      categoriesParam
        ?.split(",")
        .map((s) => s.trim())
        .filter(Boolean) ?? [];

    if (!from || !to) {
      return NextResponse.json(
        { error: "Los parámetros 'from' y 'to' son requeridos (YYYY-MM-DD)." },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 2) Cliente Supabase + usuario autenticado
    // -----------------------------------------
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "No hay usuario autenticado." },
        { status: 401 }
      );
    }

    // -----------------------------------------
    // 3) Obtener el perfil (id interno + currency)
    // -----------------------------------------
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, currency")
      .eq("auth_user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "No se encontró el perfil del usuario." },
        { status: 500 }
      );
    }

    const appUserId = profile.id;
    const currency = profile.currency ?? "COP";

    // -----------------------------------------
    // 4) Construir query base
    // -----------------------------------------
    // Select dinámico según view:
    // - full: incluye id + note (tabla/edición)
    // - analytics: evita note e id (payload menor)
    const selectClause =
      view === "analytics"
        ? "expense_date, category, amount"
        : "id, expense_date, category, amount, note";

    let query = supabase
      .from("expenses")
      .select(selectClause)
      .eq("user_id", appUserId)
      .eq("transaction_type", transaction_type)
      .gte("expense_date", from)
      .lte("expense_date", to)
      .order("expense_date", { ascending: false });

    // -----------------------------------------
    // 5) Filtro opcional por categoría(s)
    // -----------------------------------------
    if (categories.length > 0) {
      query = query.in("category", categories);
    } else if (category && category !== "all") {
      query = query.eq("category", category);
    }

    // -----------------------------------------
    // 6) Ejecutar query
    // -----------------------------------------
    const { data: expenses, error: expensesError } = await query;

    if (expensesError) {
      return NextResponse.json(
        { error: "Error al consultar gastos.", details: expensesError.message },
        { status: 500 }
      );
    }

    // -----------------------------------------
    // 7) Mapear respuesta estable según view
    // -----------------------------------------
    const result =
      view === "analytics"
        ? (expenses ?? []).map((exp: any) => ({
            date: exp.expense_date,
            categoryId: exp.category,
            amount: exp.amount,
            currency,
          }))
        : (expenses ?? []).map((exp: any) => ({
            id: exp.id,
            date: exp.expense_date,
            categoryId: exp.category,
            amount: exp.amount,
            currency,
            note: exp.note ?? "",
          }));

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("Error en /api/expenses:", err);
    return NextResponse.json(
      { error: "Error interno en /api/expenses" },
      { status: 500 }
    );
  }
}

// POST /api/expenses
// -----------------------------------------------------------------------------
// Crea un nuevo gasto manual para el usuario autenticado.
// Espera un JSON con:
//   {
//     "date": "YYYY-MM-DD",
//     "categoryId": "comida" | "transporte" | ...,
//     "amount": 25000,
//     "note": "Almuerzo"
//   }
//
// - Usa expense_date (fecha local ya normalizada en la UI).
// - Marca source = "manual" y raw_text = "".
// - Asocia user_id y auth_user_id automáticamente.
// Devuelve el registro creado en el mismo formato que el GET (view=full):
//   { id, date, categoryId, amount, currency, note }
//
// AUTORIZACIÓN (mutación):
// - En webapp permitimos ver datos aunque can_use=false,
//   pero NO permitimos mutar (crear/editar/borrar).
// - Por eso aquí validamos can_use via guardCanMutate() antes de insertar.
//
// Nota (transaction_type):
// - Por ahora en webapp solo creamos "expense".
// - Cuando agreguemos ingresos, este POST podrá aceptar "income" o
//   se creará otro endpoint/modal específico.
// -----------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Body inválido. Se esperaba un JSON." },
        { status: 400 }
      );
    }

    const { date, categoryId, amount, note } = body as {
      date?: string;
      categoryId?: string;
      amount?: number;
      note?: string;
    };

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!date || typeof date !== "string" || !dateRegex.test(date)) {
      return NextResponse.json(
        { error: "Campo 'date' inválido. Use formato YYYY-MM-DD." },
        { status: 400 }
      );
    }

    if (!categoryId || typeof categoryId !== "string") {
      return NextResponse.json(
        { error: "Campo 'categoryId' es requerido." },
        { status: 400 }
      );
    }

    const amountNumber = Number(amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return NextResponse.json(
        { error: "Campo 'amount' debe ser un número positivo." },
        { status: 400 }
      );
    }

    // Guard centralizado (session + can_use)
    const guard = await guardCanMutate();
    if (!guard.ok) return guard.res;

    const { supabase, user } = guard;

    // Obtener perfil (id interno y moneda)
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, currency")
      .eq("auth_user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          error: "No se pudo obtener el perfil del usuario.",
          details: profileError?.message ?? null,
        },
        { status: 500 }
      );
    }

    const appUserId: string = profile.id;
    const currency: string = profile.currency ?? "COP";

    const { data: inserted, error: insertError } = await supabase
      .from("expenses")
      .insert({
        user_id: appUserId,
        auth_user_id: user.id,
        transaction_type: "expense", // hoy forzado a "expense"
        amount: amountNumber,
        category: categoryId,
        note: note ?? null,
        raw_text: "",
        source: "manual",
        expense_date: date,
      })
      .select("id, expense_date, category, amount, note")
      .single();

    if (insertError || !inserted) {
      return NextResponse.json(
        {
          error: "Error al crear el gasto.",
          details: insertError?.message ?? null,
        },
        { status: 500 }
      );
    }

    const responseBody = {
      id: inserted.id,
      date: inserted.expense_date,
      categoryId: inserted.category,
      amount: inserted.amount,
      currency,
      note: inserted.note ?? "",
    };

    return NextResponse.json(responseBody, { status: 201 });
  } catch (err: any) {
    console.error("Error en POST /api/expenses:", err);
    return NextResponse.json(
      { error: "Error interno al crear el gasto." },
      { status: 500 }
    );
  }
}