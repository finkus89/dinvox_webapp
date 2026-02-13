// /api/expenses/route.ts
// ---------------------------------------------------------
// Endpoint para obtener los gastos del usuario autenticado.
//
// Recibe:
//   - from: YYYY-MM-DD  (inicio del rango)
//   - to:   YYYY-MM-DD  (fin del rango)
//   - category (opcional): id de categoría ("comida", "ropa", etc.)
//
// Usa `expense_date` (fecha local normalizada) para filtrar,
// NO created_at (que es UTC y ya no debe usarse para UI).
//
// Devuelve:
//   [
//     {
//       id,
//       expense_date,
//       category,
//       amount,
//       currency,
//       note
//     },
//     ...
//   ]
//
// Este endpoint es equivalente al de summary, pero devuelve
// registros individuales, no agregados.
// ---------------------------------------------------------

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { guardCanMutate } from "@/lib/dinvox/guard-can-mutate";

export async function GET(request: Request) {
  try {
    // -----------------------------------------
    // 1) Leer parámetros
    // -----------------------------------------
    const { searchParams } = new URL(request.url);

    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const category = searchParams.get("category"); // opcional

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
    // 3) Obtener el perfil (id interno)
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
    //     (filtrado por user_id + expense_date local)
    // -----------------------------------------
    let query = supabase
      .from("expenses")
      .select("id, expense_date, category, amount, note")
      .eq("user_id", appUserId)
      .gte("expense_date", from)
      .lte("expense_date", to)
      .order("expense_date", { ascending: false });

    // -----------------------------------------
    // 5) Filtro opcional por categoría
    // -----------------------------------------
    if (category && category !== "all") {
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
    // 7) Mapear respuesta a un formato estable
    // -----------------------------------------
    const result = (expenses ?? []).map((exp) => ({
      id: exp.id,
      date: exp.expense_date, // YYYY-MM-DD local
      categoryId: exp.category, // coincide con CATEGORIES
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
// Devuelve el registro creado en el mismo formato que el GET:
//   {
//     id, date, categoryId, amount, currency, note
//   }
//
// 🆕 AUTORIZACIÓN (mutación):
// - En webapp permitimos ver datos aunque can_use=false,
//   pero NO permitimos mutar (crear/editar/borrar).
// - Por eso aquí validamos can_use via guardCanMutate() antes de insertar.
// -----------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    // 1) Leer y validar el body
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

    // Validar fecha básica: formato YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!date || typeof date !== "string" || !dateRegex.test(date)) {
      return NextResponse.json(
        { error: "Campo 'date' inválido. Use formato YYYY-MM-DD." },
        { status: 400 }
      );
    }

    // Validar categoría
    if (!categoryId || typeof categoryId !== "string") {
      return NextResponse.json(
        { error: "Campo 'categoryId' es requerido." },
        { status: 400 }
      );
    }

    // Validar monto
    const amountNumber = Number(amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return NextResponse.json(
        { error: "Campo 'amount' debe ser un número positivo." },
        { status: 400 }
      );
    }

    // 2) 🆕 Guard centralizado (session + can_use)
    const guard = await guardCanMutate();
    if (!guard.ok) return guard.res;

    const { supabase, user } = guard;

    // 3) Obtener perfil (id interno y moneda)
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

    // 4) Insertar el gasto en la tabla expenses
    const { data: inserted, error: insertError } = await supabase
      .from("expenses")
      .insert({
        user_id: appUserId,
        auth_user_id: user.id,
        amount: amountNumber,
        category: categoryId,
        note: note ?? null,
        raw_text: "",
        source: "manual",
        expense_date: date, // YYYY-MM-DD local
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

    // 5) Formato de respuesta alineado con el GET
    const responseBody = {
      id: inserted.id,
      date: inserted.expense_date, // YYYY-MM-DD
      categoryId: inserted.category, // ej: "comida"
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
