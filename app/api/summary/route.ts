/**
 * API: /api/summary
 * ------------------
 * Devuelve el resumen del usuario autenticado entre un rango de fechas.
 *
 * 🔹 Entrada (query params):
 *     - from : "YYYY-MM-DD"  ← fecha local
 *     - to   : "YYYY-MM-DD"  ← fecha local
 *     - transaction_type (opcional): "expense" | "income"     🆕 (preparación ingresos)
 *
 * 🔹 Lógica (v2 - usando RPC):
 *     1. Valida parámetros.
 *     2. Obtiene usuario autenticado (Supabase Auth).
 *     3. Lee perfil (currency, language, timezone) desde `users` (solo metadatos UI).
 *     4. Llama RPC `get_range_summary()` filtrando por:
 *          - auth_user_id (source of truth)
 *          - transaction_type
 *          - expense_date (DATE local)
 *     5. Calcula percent por categoría en la API (no en SQL).
 *     6. Devuelve estructura lista para SummaryCard.
 *
 * 🆕 Nota (transaction_type):
 * - Por ahora la UI solo usa "expense".
 * - Dejamos el parámetro listo para un tab futuro (Ingresos),
 *   sin romper el comportamiento actual.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // 🆕 transaction_type (preparación ingresos)
    // Default: "expense" para mantener comportamiento actual.
    const transactionTypeParam = (searchParams.get("transaction_type") ?? "").trim();
    const transaction_type =
      transactionTypeParam === "income" || transactionTypeParam === "expense"
        ? transactionTypeParam
        : "expense";

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
    //    (solo para moneda/idioma/tz en UI)
    // -----------------------------------------
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("currency, language, timezone")
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

    const currency = profile.currency ?? "COP";
    const timezone = profile.timezone ?? "America/Bogota";
    const language = profile.language ?? "es-CO";

    // -----------------------------------------
    // 5. RPC: Resumen por rango (source of truth)
    //    - Filtra por auth_user_id
    //    - Respeta transaction_type ("expense" | "income")
    //    - Devuelve by_category sin percent (percent lo calcula la API)
    // -----------------------------------------
    const { data: rpcRows, error: rpcError } = await supabase.rpc("get_range_summary", {
      p_auth_user_id: user.id,
      p_from: from,
      p_to: to,
      p_transaction_type: transaction_type, // "expense" por default
    });

    if (rpcError) {
      return NextResponse.json(
        {
          error: "Error al consultar resumen (RPC).",
          details: rpcError.message,
        },
        { status: 500 }
      );
    }

    const rpc = Array.isArray(rpcRows) ? rpcRows[0] : null;

    // En caso raro: RPC sin fila (no debería pasar, pero protegemos)
    const total = Number(rpc?.total_amount) || 0;
    const count = Number(rpc?.count) || 0;

    // by_category viene como JSONB array [{category_id, amount, count}, ...]
    const rawByCategory = (rpc?.by_category ?? []) as Array<{
      category_id?: string;
      amount?: number | string;
      count?: number | string;
    }>;

    // -----------------------------------------
    // 6. Adaptar a formato UI + calcular percent
    // -----------------------------------------
    const categories = (Array.isArray(rawByCategory) ? rawByCategory : [])
      .map((x) => {
        const categoryId = String(x?.category_id ?? "otros");
        const amount = Number(x?.amount) || 0;

        return {
          categoryId,
          amount,
          percent: total > 0 ? Number(((amount * 100) / total).toFixed(2)) : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // -----------------------------------------
    // 7. Respuesta final para la UI
    // -----------------------------------------
    return NextResponse.json(
      {
        total,
        currency,
        language,
        categories,
        meta: {
          from,
          to,
          timezone,
          count,
          transaction_type, // útil para depuración/UI futura
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