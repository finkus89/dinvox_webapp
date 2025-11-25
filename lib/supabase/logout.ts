"use server";

import { createClient } from "./server";

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
