/**
 * API: /api/summary
 * ------------------
 * Devuelve el resumen de gastos del usuario autenticado entre un rango de fechas.
 *
 * 🔹 Entrada (query params):
 *     - from : "YYYY-MM-DD"  ← fecha local
 *     - to   : "YYYY-MM-DD"  ← fecha local
 *
 * 🔹 Lógica:
 *     1. Valida parámetros.
 *     2. Obtiene usuario autenticado (Supabase Auth).
 *     3. Lee su perfil interno (tabla users).
 *     4. Consulta gastos filtrando por expense_date (DATE local).
 *     5. Agrupa por categoría (columna `category` en la BD).
 *     6. Calcula total y porcentaje por categoría.
 *     7. Devuelve estructura lista para SummaryCard.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // -----------------------------------------
    // 1. Validación básica de parámetros
    // -----------------------------------------
    if (!from || !to) {
      return NextResponse.json(
        { error: "Parámetros 'from' y 'to' son requeridos (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 2. Cliente Supabase (server-side)
    // -----------------------------------------
    const supabase = await createClient();

    // -----------------------------------------
    // 3. Usuario autenticado vía Supabase Auth
    // -----------------------------------------
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "No se pudo obtener el usuario autenticado" },
        { status: 401 }
      );
    }

    // -----------------------------------------
    // 4. Perfil del usuario en tabla `users`
    //    - auth_user_id → id de Auth
    //    - id → user_id interno para `expenses.user_id`
    // -----------------------------------------
    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("users")
      .select("id, currency, timezone")
      .eq("auth_user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          error: "No se pudo obtener el perfil del usuario en 'users'",
          details: profileError?.message ?? null,
        },
        { status: 500 }
      );
    }

    const appUserId = profile.id;
    const currency = profile.currency;
    const timezone = profile.timezone;

    // -----------------------------------------
    // 5. Consultar gastos usando expense_date (DATE)
    //    IMPORTANTE: aquí usamos la columna `category`
    // -----------------------------------------
    const {
      data: expenses,
      error: expensesError,
    } = await supabase
      .from("expenses")
      .select("amount, category, expense_date")
      .eq("user_id", appUserId)
      .gte("expense_date", from)
      .lte("expense_date", to);

    if (expensesError) {
      return NextResponse.json(
        {
          error: "Error al consultar los gastos",
          details: expensesError.message,
        },
        { status: 500 }
      );
    }

    const safeExpenses = expenses ?? [];

    // -----------------------------------------
    // 6. Agrupar por categoría y calcular total
    // -----------------------------------------
    const totals = new Map<string, number>();
    let total = 0;

    for (const exp of safeExpenses) {
      // En BD la columna sigue siendo `category`
      const categoryId = (exp as any).category ?? "otros";
      const amount = Number((exp as any).amount) || 0;

      totals.set(categoryId, (totals.get(categoryId) ?? 0) + amount);
      total += amount;
    }

    // -----------------------------------------
    // 7. Construir arreglo de categorías con porcentaje
    // -----------------------------------------
    const categories = Array.from(totals.entries())
      .map(([categoryId, amount]) => ({
        categoryId,
        amount,
        percent:
          total > 0 ? Number(((amount * 100) / total).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // -----------------------------------------
    // 8. Respuesta final para la UI
    // -----------------------------------------
    return NextResponse.json(
      {
        total,
        currency,
        categories,
        meta: {
          from,
          to,
          timezone,
          count: safeExpenses.length,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error en /api/summary:", err);
    return NextResponse.json(
      { error: "Error interno en /api/summary" },
      { status: 500 }
    );
  }
}
