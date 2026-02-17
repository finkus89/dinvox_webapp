// -----------------------------------------------------------
// POST /api/settings/start-channel-change
//
// Inicia cambio de canal:
// - Valida sesión
// - Llama RPC start_channel_change()
// - Setea pending_channel
// - Genera nuevo token en BD
//
// Body:
// {
//   newChannel: "telegram" | "whatsapp"
// }
//
// Response:
// { ok: true }
// -----------------------------------------------------------

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1️⃣ Validar sesión
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // 2️⃣ Leer body
    const body = await request.json().catch(() => null);

    if (!body || !body.newChannel) {
      return NextResponse.json(
        { ok: false, error: "INVALID_BODY" },
        { status: 400 }
      );
    }

    const { newChannel } = body;

    // 3️⃣ Llamar RPC
    const { data, error } = await supabase.rpc(
      "start_channel_change",
      {
        p_auth_user_id: user.id,
        p_new_channel: newChannel,
      }
    );

    if (error) {
      console.error("RPC start_channel_change error:", error);
      return NextResponse.json(
        { ok: false, error: "RPC_FAILED" },
        { status: 500 }
      );
    }

    if (!data?.ok) {
      return NextResponse.json(
        { ok: false, error: data?.error ?? "UNKNOWN_ERROR" },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });

  } catch (err) {
    console.error("start-channel-change fatal:", err);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
