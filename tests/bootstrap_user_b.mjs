import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) throw new Error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");

const email = process.env.BOOTSTRAP_B_EMAIL || "coelhojh+mantivo-b@gmail.com";
const password = process.env.BOOTSTRAP_B_PASS || "Mantivo#123456";
const tenantNameBase = process.env.BOOTSTRAP_B_TENANT || "Tenant USER_B (test)";
const uniq = new Date().toISOString().replace(/[-:.TZ]/g,"").slice(0,14);
const tenantName = `${tenantNameBase} ${uniq}`;

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

console.log("== Sign in USER_B ==");
const { data: signInData, error: signInErr } =
  await supabase.auth.signInWithPassword({ email, password });

if (signInErr) {
  console.error("\nLOGIN FAILED:", signInErr.message);
  process.exit(1);
}

console.log("== Create tenant for USER_B ==");
// IMPORTANTE: use o MESMO client logado (token vai junto)
const { data: tenantRow, error: tenantErr } = await supabase
    .rpc("create_tenant", { p_name: tenantName })
    .single();

if (tenantErr) {
  console.error("Tenant insert failed:", tenantErr.message);
  process.exit(1);
}

console.log("\n✅ USER_B ready:");
console.log("EMAIL=", email);
console.log("PASS =", password);
console.log("TENANT_B_ID=", tenantRow.id);
