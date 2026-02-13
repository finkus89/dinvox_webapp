// app/api/expenses/[id]/route.ts
// -----------------------------------------------------------------------------
// DELETE /api/expenses/:id
//
// Elimina un gasto específico del usuario autenticado.
//
// Flujo:
// 1.  Sacar el id desde la URL: /api/expenses/xxxxx
// 2. Verificar usuario autenticado.
// 3. Buscar que el gasto exista y pertenezca al usuario (user_id).
// 4. Eliminar el gasto.
// 5. Devolver JSON { success: true }.
//
// 🆕 AUTORIZACIÓN (mutación):
// - En webapp permitimos ver datos aunque can_use=false,
//   pero NO permitimos mutar (crear/editar/borrar).
// - Por eso aquí validamos can_use via guardCanMutate() antes de eliminar.
// -----------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { guardCanMutate } from "@/lib/dinvox/guard-can-mutate";

export async function DELETE(request: Request) {
  try {
    // 1) Sacar el id desde la URL: /api/expenses/xxxxx
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.length - 1];

    if (!id) {
      return NextResponse.json(
        { error: "ID del gasto no proporcionado." },
        { status: 400 }
      );
    }

    // 2) 🆕 Guard centralizado (session + can_use)
    const guard = await guardCanMutate();
    if (!guard.ok) return guard.res;

    const { supabase, user } = guard;

    // 3) Borrar SOLO si pertenece al usuario
    const { error: deleteError } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("auth_user_id", user.id);

    if (deleteError) {
      return NextResponse.json(
        {
          error: "Error al eliminar el gasto.",
          details: deleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id }, { status: 200 });
  } catch (err: any) {
    console.error("Error en DELETE /api/expenses/[id]:", err);
    return NextResponse.json(
      { error: "Error interno al eliminar el gasto." },
      { status: 500 }
    );
  }
}

// PATCH /api/expenses/:id
// -----------------------------------------------------------------------------
// Actualiza un gasto específico del usuario autenticado.
//
// Body JSON (todos opcionales, pero al menos uno):
// {
//   "date": "YYYY-MM-DD",
//   "categoryId": "comida" | "transporte" | ...,
//   "amount": 25000,
//   "note": "Almuerzo con Juan"
// }
//
// - Solo se actualizan los campos enviados.
// - Valida formato básico de fecha y monto.
// - Respeta RLS: solo se puede modificar un gasto propio.
//
// 🆕 AUTORIZACIÓN (mutación):
// - En webapp permitimos ver datos aunque can_use=false,
//   pero NO permitimos mutar (crear/editar/borrar).
// - Por eso aquí validamos can_use via guardCanMutate() antes de actualizar.
// -----------------------------------------------------------------------------
export async function PATCH(request: Request) {
  try {
    // 1) Sacar el id desde la URL: /api/expenses/xxxxx
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.length - 1];

    if (!id) {
      return NextResponse.json(
        { error: "ID del gasto no proporcionado." },
        { status: 400 }
      );
    }

    // 2) Leer body
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
      note?: string | null;
    };

    // 3) Validar que haya al menos un campo a actualizar
    if (
      date === undefined &&
      categoryId === undefined &&
      amount === undefined &&
      note === undefined
    ) {
      return NextResponse.json(
        { error: "No se envió ningún campo para actualizar." },
        { status: 400 }
      );
    }

    // 4) Construir objeto de updates
    const updates: Record<string, any> = {};

    // Fecha (opcional)
    if (date !== undefined) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (typeof date !== "string" || !dateRegex.test(date)) {
        return NextResponse.json(
          { error: "Campo 'date' inválido. Use formato YYYY-MM-DD." },
          { status: 400 }
        );
      }
      updates.expense_date = date;
    }

    // Categoría (opcional)
    if (categoryId !== undefined) {
      if (typeof categoryId !== "string" || !categoryId) {
        return NextResponse.json(
          { error: "Campo 'categoryId' inválido." },
          { status: 400 }
        );
      }
      updates.category = categoryId;
    }

    // Monto (opcional)
    if (amount !== undefined) {
      const amountNumber = Number(amount);
      if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
        return NextResponse.json(
          { error: "Campo 'amount' debe ser un número positivo." },
          { status: 400 }
        );
      }
      updates.amount = amountNumber;
    }

    // Nota (opcional; se permite string vacío o null)
    if (note !== undefined) {
      updates.note = note ?? null;
    }

    // 5) 🆕 Guard centralizado (session + can_use)
    const guard = await guardCanMutate();
    if (!guard.ok) return guard.res;

    const { supabase, user } = guard;

    // 6) Obtener moneda del usuario (igual que en POST)
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("currency")
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

    const currency: string = profile.currency ?? "COP";

    // 7) Actualizar SOLO si el gasto pertenece al usuario
    const { data: updated, error: updateError } = await supabase
      .from("expenses")
      .update(updates)
      .eq("id", id)
      .eq("auth_user_id", user.id)
      .select("id, expense_date, category, amount, note")
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        {
          error: "Error al actualizar el gasto.",
          details: updateError?.message ?? null,
        },
        { status: 500 }
      );
    }

    // 8) Respuesta alineada con GET/POST
    const responseBody = {
      id: updated.id,
      date: updated.expense_date, // YYYY-MM-DD
      categoryId: updated.category, // ej: "comida"
      amount: updated.amount,
      currency,
      note: updated.note ?? "",
    };

    return NextResponse.json(responseBody, { status: 200 });
  } catch (err: any) {
    console.error("Error en PATCH /api/expenses/[id]:", err);
    return NextResponse.json(
      { error: "Error interno al actualizar el gasto." },
      { status: 500 }
    );
  }
}
