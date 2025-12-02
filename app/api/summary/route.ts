import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeDateRangeToUTC } from "@/lib/dinvox/date-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        { error: "Parámetros 'from' y 'to' son requeridos (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    // 1) Cliente de Supabase (server-side)
    const supabase = await createClient();

    // 2) Usuario autenticado (Auth)
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

    // 3) Perfil en tabla users:
    //    - auth_id = user.id (de Supabase Auth)
    //    - id      = UUID interno que usa expenses.user_id
    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("users")
      .select("id, currency, timezone")
      .eq("auth_user_id", user.id)  // 👈 clave: buscamos por auth_id
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          error: "No se pudo obtener el perfil del usuario en 'users'",
          details: profileError?.message ?? null,
          authUserId: user.id,
        },
        { status: 500 }
      );
    }

    const appUserId: string = profile.id;          // 👈 este es el que usan los gastos
    const currency: string = profile.currency;
    const timezone: string = profile.timezone;

    // 4) Normalizar rango local → UTC
    const { fromUtc, toUtc } = normalizeDateRangeToUTC(from, to, timezone);

    // 5) Consultar expenses del usuario interno (users.id)
    const {
      data: expenses,
      error: expensesError,
    } = await supabase
      .from("expenses")
      .select("amount, category, created_at")
      .eq("user_id", appUserId)   // 👈 aquí usamos el id interno, NO el auth
      .gte("created_at", fromUtc)
      .lte("created_at", toUtc);

    if (expensesError) {
      return NextResponse.json(
        {
          error: "Error al consultar los gastos",
          details: expensesError.message,
        },
        { status: 500 }
      );
    }

    const safeExpenses = expenses || [];

    // 6) Agrupar por categoría y calcular total
    const categoryTotals = new Map<string, number>();
    let total = 0;

    for (const exp of safeExpenses) {
      const category = (exp as any).category || "otros";
      const amount = Number((exp as any).amount) || 0;

      if (!categoryTotals.has(category)) {
        categoryTotals.set(category, 0);
      }
      const current = (categoryTotals.get(category) || 0) + amount;
      categoryTotals.set(category, current);
      total += amount;
    }

    // 7) Construir array de categorías con amount y percent
    const categories = Array.from(categoryTotals.entries())
      .map(([categoryId, amount]) => {
        const percent = total > 0 ? (amount * 100) / total : 0;
        return {
          categoryId,
          amount,
          percent: Number(percent.toFixed(2)),
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // 8) Respuesta
    const responseBody = {
      total,
      currency,
      categories,
      meta: {
        from,
        to,
        fromUtc,
        toUtc,
        timezone,
        count: safeExpenses.length,
        appUserId,
        authUserId: user.id,
      },
    };

    return NextResponse.json(responseBody, { status: 200 });
  } catch (err: any) {
    console.error("Error en /api/summary:", err);
    return NextResponse.json(
      { error: "Error interno en /api/summary" },
      { status: 500 }
    );
  }
}
