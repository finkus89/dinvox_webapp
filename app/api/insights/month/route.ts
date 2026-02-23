// src/app/api/insights/month/route.ts
// -----------------------------------------------------------------------------
// Dinvox - Insights (v2): /api/insights/month
//
// OBJETIVO
// - Endpoint server-to-server (para n8n / botón rápido en canal).
// - Retorna TEXTO listo para enviar al usuario.
//
// CONTRATO (request)
// - Method: GET
// - Header: x-dinvox-key: <DINVOX_SERVER_KEY>
// - Query:  auth_user_id=<uuid>
//          transaction_type=<expense|income>     🆕 opcional (preparación ingresos)
//
// CONTRATO (response)
// {
//   kind: "no_data" | "summary",
//   confidence: "low" | "medium" | "high",
//   message: string
// }
//
// CAMBIO v2 (RPC)
// - Ya NO consulta directamente la tabla `expenses`.
// - Usa RPC `get_range_summary()` como fuente de verdad.
// - El cálculo de percent se hace aquí (igual que en /api/summary).
// - Rango fijo: este mes a hoy (DATE local "expense_date") en TZ del usuario.
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

function getYMDPartsInTimeZone(date: Date, timeZone: string) {
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

    const transactionTypeParam = (searchParams.get("transaction_type") ?? "").trim();
    const transaction_type =
      transactionTypeParam === "income" || transactionTypeParam === "expense"
        ? transactionTypeParam
        : "expense";

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
    // 3) Leer perfil (tabla users)
    // -------------------------------------------------------------------------
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("currency, language, timezone")
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

    const currency = profile.currency ?? "COP";
    const language = profile.language ?? "es-CO";
    const timezone = profile.timezone ?? "America/Bogota";

    // -------------------------------------------------------------------------
    // 4) Rango fijo: este mes a hoy (en TZ del user)
    // -------------------------------------------------------------------------
    const todayParts = getYMDPartsInTimeZone(new Date(), timezone);
    const to = ymdFromParts(todayParts);
    const from = `${todayParts.y}-${pad2(todayParts.m)}-01`;

    // -------------------------------------------------------------------------
    // 5) RPC: get_range_summary (fuente de verdad)
    // -------------------------------------------------------------------------
    const { data: rpcRows, error: rpcError } = await supabase.rpc(
      "get_range_summary",
      {
        p_auth_user_id: auth_user_id,
        p_from: from,
        p_to: to,
        p_transaction_type: transaction_type,
      }
    );

    if (rpcError) {
      return NextResponse.json(
        { error: "Error en RPC get_range_summary", details: rpcError.message },
        { status: 500 }
      );
    }

    const rpc = Array.isArray(rpcRows) ? rpcRows[0] : null;

    const total = Number(rpc?.total_amount) || 0;
    const count = Number(rpc?.count) || 0;

    const rawByCategory = (rpc?.by_category ?? []) as Array<{
      category_id?: string;
      amount?: number | string;
    }>;

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

    const monthSummary = {
      total,
      categories,
      meta: {
        count,
        from,
        to,
        timezone,
        transaction_type,
      },
    };

    // -------------------------------------------------------------------------
    // 6) Motor de insight (v1 - summary)
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