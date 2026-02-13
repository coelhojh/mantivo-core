import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY;

const email = process.env.BOOTSTRAP_B_EMAIL;
const password = process.env.BOOTSTRAP_B_PASS;

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

const accessToken = signInData.session?.access_token;

console.log("user.id =", signInData.user.id);

console.log("== Call RPC whoami via fetch ==");
const res = await fetch(`${url}/rest/v1/rpc/whoami`, {
  method: "POST",
  headers: {
    apikey: anon,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: "{}",
});

const text = await res.text();
console.log("HTTP", res.status, res.statusText);
console.log(text);
