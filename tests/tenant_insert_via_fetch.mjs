import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY;

const email = process.env.BOOTSTRAP_B_EMAIL;
const password = process.env.BOOTSTRAP_B_PASS;
const tenantName = process.env.BOOTSTRAP_B_TENANT || "Tenant USER_B (test)";

if (!url || !anon) throw new Error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
if (!email || !password) throw new Error("Missing BOOTSTRAP_B_EMAIL / BOOTSTRAP_B_PASS");

const supabase = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

console.log("== Sign in USER_B ==");
const { data: signInData, error: signInErr } =
  await supabase.auth.signInWithPassword({ email, password });

if (signInErr) {
  console.error("LOGIN FAILED:", signInErr.message);
  process.exit(1);
}

const accessToken = signInData.session.access_token;

console.log("== Insert tenant via fetch (PostgREST) ==");
const res = await fetch(`${url}/rest/v1/tenants?select=id,name,slug,created_by`, {
  method: "POST",
  headers: {
    apikey: anon,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  },
  body: JSON.stringify({ name: tenantName }),
});

const text = await res.text();
if (!res.ok) {
  console.error("HTTP", res.status, res.statusText);
  console.error(text);
  process.exit(1);
}

const row = JSON.parse(text)[0];
console.log("\n✅ TENANT CREATED:");
console.log("TENANT_B_ID=", row.id);
console.log("NAME=", row.name);
console.log("SLUG=", row.slug);
console.log("CREATED_BY=", row.created_by);
