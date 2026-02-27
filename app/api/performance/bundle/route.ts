/**
 * Dinvox — Performance Bundle API (UI Session-Based)
 * ---------------------------------------------------
 * Ubicación:
 *   webapp/src/app/api/performance/bundle/route.ts
 *
 * Qué hace:
 *   - Endpoint para la UI (dashboard / performance page).
 *   - Usa la sesión del usuario (auth.uid()).
 *   - Recibe rangos YA calculados en timezone del usuario.
 *   - Llama al Performance Bundle (data-only).
 *   - Devuelve JSON normalizado para UI.
 *
 * Qué NO hace:
 *   - NO calcula fechas.
 *   - NO resuelve timezone.
 *   - NO genera insights.
 *
 * Responsabilidad de fechas:
 *   - Los rangos (from/to) deben ser calculados en la UI
 *     usando la timezone del usuario desde AppContext.
 *
 * Query params esperados (YYYY-MM-DD):
 *   - fromSummary
 *   - toSummary
 *   - fromDaily
 *   - toDaily
 *   - fromMonthly
 *   - toMonthly
 *   - transactionType (opcional: expense | income)
 */

import "server-only";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPerformanceBundleData } from "@/lib/analytics/bundle/getPerformanceBundle";

/**
 * Valida formato YYYY-MM-DD simple.
 * No valida existencia real de fecha (eso no es responsabilidad del endpoint).
 */
function isYmd(v: string | null): v is string {
  return !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

export async function GET(req: Request) {
  const supabase = await createClient();

  /**
   * 1) Validar usuario autenticado (session-based).
   *    Este endpoint solo funciona para UI logueada.
   */
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const authUserId = auth.user.id;

  /**
   * 2) Leer rangos desde query params.
   *    Estos rangos deben venir calculados en la timezone real del usuario.
   */
  const url = new URL(req.url);

  const fromSummary = url.searchParams.get("fromSummary");
  const toSummary = url.searchParams.get("toSummary");

  const fromDaily = url.searchParams.get("fromDaily");
  const toDaily = url.searchParams.get("toDaily");

  const fromMonthly = url.searchParams.get("fromMonthly");
  const toMonthly = url.searchParams.get("toMonthly");

  if (
    !isYmd(fromSummary) ||
    !isYmd(toSummary) ||
    !isYmd(fromDaily) ||
    !isYmd(toDaily) ||
    !isYmd(fromMonthly) ||
    !isYmd(toMonthly)
  ) {
    return NextResponse.json(
      {
        error: "BAD_REQUEST",
        message:
          "Missing or invalid date params. Expected YYYY-MM-DD for fromSummary,toSummary,fromDaily,toDaily,fromMonthly,toMonthly.",
      },
      { status: 400 }
    );
  }

  /**
   * 3) Normalizar transactionType.
   *    Por ahora Dinvox usa principalmente 'expense'.
   */
  const transactionTypeRaw =
    url.searchParams.get("transactionType") ?? "expense";

  const transactionType =
    transactionTypeRaw === "income" ? "income" : "expense";

  /**
   * 4) Llamar al Performance Bundle (data-only).
   *    El bundle:
   *      - No calcula lógica.
   *      - No genera texto.
   *      - Solo trae datos agregados desde RPCs.
   */
  try {
    const bundle = await getPerformanceBundleData(supabase, {
      authUserId,
      fromSummary,
      toSummary,
      fromDaily,
      toDaily,
      fromMonthly,
      toMonthly,
      transactionType,
    });

    /**
     * 5) Retornar datos a la UI.
     */
    return NextResponse.json({ bundle });
  } catch (err: any) {
    /**
     * En caso de error interno (RPC, conexión, etc),
     * devolvemos 500 controlado.
     * El logging detallado debería hacerse server-side.
     */
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: err?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}