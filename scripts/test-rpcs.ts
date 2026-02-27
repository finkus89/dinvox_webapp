import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const AUTH_USER_ID = process.env.TEST_AUTH_USER_ID!; // ponlo en .env.local

if (!SUPABASE_URL || !SERVICE_ROLE || !AUTH_USER_ID) {
  throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TEST_AUTH_USER_ID");
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

async function main() {
  const { data: daily, error: dailyErr } = await supabase.rpc("get_daily_totals", {
    p_auth_user_id: AUTH_USER_ID,
    p_from: "2026-02-01",
    p_to: "2026-02-26",
    p_transaction_type: "expense",
  });

  if (dailyErr) throw dailyErr;
  console.log("daily_totals rows:", daily?.length ?? 0);
  console.log(daily?.slice(0, 5));

  const { data: monthlyCat, error: monthlyErr } = await supabase.rpc("get_monthly_category_totals", {
    p_auth_user_id: AUTH_USER_ID,
    p_from: "2025-03-01",
    p_to: "2026-02-26",
    p_transaction_type: "expense",
  });

  if (monthlyErr) throw monthlyErr;
  console.log("monthly_category_totals rows:", monthlyCat?.length ?? 0);
  console.log(monthlyCat?.slice(0, 10));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});