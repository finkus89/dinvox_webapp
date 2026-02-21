// src/app/api/insights/month/route.ts
// -----------------------------------------------------------------------------
// Dinvox - Insights (v1): /api/insights/month
//
// OBJETIVO
// - Endpoint server-to-server (para n8n / botón rápido en canal).
// - Retorna TEXTO listo para enviar al usuario.
//
// CONTRATO (request)
// - Method: GET
// - Header: x-dinvox-key: <DINVOX_SERVER_KEY>
// - Query:  auth_user_id=<uuid>
//
// CONTRATO (response)
// {
//   kind: "no_data" | "summary",
//   confidence: "low" | "medium" | "high",
//   message: string
// }
//
// NOTAS DE DISEÑO
// - NO usa sesión web (Supabase Auth cookies).
// - Usa service role para leer perfil + gastos por auth_user_id.
// - Rango fijo: este mes a hoy (DATE local "expense_date") en TZ del usuario.
// - Por ahora SOLO summary (dona/barras). Ritmo/Evolución quedan para v2.
// -----------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { pad2 } from "@/lib/analytics/dates";
import buildMonthSummaryInsight from "@/lib/analytics/insights/month-summary";

const SERVER_KEY_HEADER = "x-dinvox-key";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const DINVOX_SERVER_KEY = process.env.DINVOX_SERVER_KEY || "";

function requireEnv(name: string, value: string) {
  if (!value) throw new Error(`Missing env var: ${name}`);
}

function getHeader(req: Request, name: string) {
  return req.headers.get(name) || req.headers.get(name.toLowerCase()) || "";
}

/**
 * Devuelve { y, m, d } como números usando la TZ del usuario.
 * - Importante: NO usamos Date.getFullYear()/getMonth() porque eso usa TZ del server.
 * - Usamos Intl.DateTimeFormat con timeZone para obtener la fecha "lógica" local.
 */
function getYMDPartsInTimeZone(date: Date, timeZone: string): {
  y: number;
  m: number;
  d: number;
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const y = Number(parts.find((p) => p.type === "year")?.value ?? "1970");
  const m = Number(parts.find((p) => p.type === "month")?.value ?? "01");
  const d = Number(parts.find((p) => p.type === "day")?.value ?? "01");

  return { y, m, d };
}

function ymdFromParts(p: { y: number; m: number; d: number }) {
  return `${p.y}-${pad2(p.m)}-${pad2(p.d)}`;
}

export async function GET(request: Request) {
  try {
    // -------------------------------------------------------------------------
    // 0) ENV y auth server key
    // -------------------------------------------------------------------------
    requireEnv("DINVOX_SERVER_KEY", DINVOX_SERVER_KEY);
    requireEnv("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);
    requireEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY);

    const key = getHeader(request, SERVER_KEY_HEADER);
    if (!key || key !== DINVOX_SERVER_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // -------------------------------------------------------------------------
    // 1) Params
    // -------------------------------------------------------------------------
    const { searchParams } = new URL(request.url);
    const auth_user_id = searchParams.get("auth_user_id");

    if (!auth_user_id) {
      return NextResponse.json(
        { error: "Missing query param: auth_user_id" },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------------------
    // 2) Supabase service client (server-to-server)
    // -------------------------------------------------------------------------
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // -------------------------------------------------------------------------
    // 3) Leer perfil (tabla users) por auth_user_id
    // -------------------------------------------------------------------------
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, currency, language, timezone")
      .eq("auth_user_id", auth_user_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          error: "No se pudo obtener el perfil del usuario",
          details: profileError?.message ?? null,
        },
        { status: 404 }
      );
    }

    const appUserId = profile.id as string;
    const currency = (profile.currency ?? "COP") as string;
    const language = (profile.language ?? "es-CO") as string;
    const timezone = (profile.timezone ?? "America/Bogota") as string;

    // -------------------------------------------------------------------------
    // 4) Rango fijo: este mes a hoy (en TZ del user)
    // -------------------------------------------------------------------------
    const todayParts = getYMDPartsInTimeZone(new Date(), timezone);
    const to = ymdFromParts(todayParts);
    const from = `${todayParts.y}-${pad2(todayParts.m)}-01`;

    // -------------------------------------------------------------------------
    // 5) Consultar gastos por expense_date (DATE local)
    // -------------------------------------------------------------------------
    const { data: expenses, error: expensesError } = await supabase
      .from("expenses")
      .select("amount, category, expense_date")
      .eq("user_id", appUserId)
      .gte("expense_date", from)
      .lte("expense_date", to);

    if (expensesError) {
      return NextResponse.json(
        { error: "Error al consultar gastos", details: expensesError.message },
        { status: 500 }
      );
    }

    const safeExpenses = expenses ?? [];

    // -------------------------------------------------------------------------
    // 6) Agrupar por categoría y construir summary (igual a /api/summary)
    // -------------------------------------------------------------------------
    const totals = new Map<string, number>();
    let total = 0;

    for (const exp of safeExpenses as any[]) {
      const categoryId = exp?.category ?? "otros";
      const amount = Number(exp?.amount) || 0;
      totals.set(categoryId, (totals.get(categoryId) ?? 0) + amount);
      total += amount;
    }

    const categories = Array.from(totals.entries())
      .map(([categoryId, amount]) => ({
        categoryId,
        amount,
        percent: total > 0 ? Number(((amount * 100) / total).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const monthSummary = {
      total,
      categories,
      meta: {
        count: safeExpenses.length,
        from,
        to,
        timezone,
      },
    };

    // -------------------------------------------------------------------------
    // 7) Motor v1 (solo Summary -> texto listo)
    // -------------------------------------------------------------------------
    const result = buildMonthSummaryInsight({
      summary: monthSummary,
      currency,
      language,
      timezone,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("Error en /api/insights/month:", err);
    return NextResponse.json(
      { error: "Error interno en /api/insights/month" },
      { status: 500 }
    );
  }
}