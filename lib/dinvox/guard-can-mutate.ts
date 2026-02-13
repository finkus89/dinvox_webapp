// src/lib/dinvox/guard-can-mutate.ts
// ------------------------------------------------------------
// Dinvox | Guard de mutación (webapp API)
// ------------------------------------------------------------
// Objetivo:
// - Permitir ver datos en la webapp aunque can_use=false.
// - Bloquear mutaciones (crear/editar/borrar) si can_use=false.
// - La autoridad viene de la RPC (valida por fechas en DB).
//
// Uso en endpoints:
//   const guard = await guardCanMutate();
//   if (!guard.ok) return guard.res;
//   const { supabase, user } = guard;
// ------------------------------------------------------------

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function guardCanMutate() {
  // 1) Cliente Supabase + usuario autenticado
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false as const,
      res: NextResponse.json({ error: "No hay usuario autenticado." }, { status: 401 }),
    };
  }

  // 2) Validar permisos de mutación por RPC
  //    OJO: la firma exige p_channel y p_provider_chat_id aunque no se usen con p_auth_user_id
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "get_user_context_by_channel_id",
    {
      p_channel: "telegram",
      p_provider_chat_id: "",
      p_auth_user_id: user.id,
    }
  );

  if (rpcError) {
    // Por seguridad: si no podemos validar, no permitimos mutación
    return {
      ok: false as const,
      res: NextResponse.json(
        { error: "No se pudo validar permisos para mutar." },
        { status: 500 }
      ),
    };
  }

  const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
  const canUse = !!row?.can_use;

  if (!canUse) {
    return {
      ok: false as const,
      res: NextResponse.json(
        { error: "Modo lectura: tu suscripción no permite editar o registrar gastos." },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const, supabase, user };
}
