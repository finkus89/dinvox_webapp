// src/app/api/settings/cancel-channel-change/route.ts
// ---------------------------------------------------
// POST: cancela un cambio de canal pendiente
// - Requiere sesión válida
// - Limpia users.pending_channel
// - No toca channel ni ids
//
// Response:
//   200 -> { ok: true }
//   401 -> { ok: false, error: "UNAUTHORIZED" }
//   500 -> { ok: false, error: "UPDATE_FAILED" | "SERVER_ERROR" }

// src/app/api/settings/cancel-channel-change/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    // ✅ En tu setup createClient() retorna Promise<SupabaseClient>
    const supabase = await createClient();

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

    const { error: updateError } = await supabase
      .from("users")
      .update({ pending_channel: null })
      .eq("auth_user_id", user.id);

    if (updateError) {
      console.error("cancel-channel-change update error:", updateError);
      return NextResponse.json(
        { ok: false, error: "UPDATE_FAILED", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("cancel-channel-change fatal:", err);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
