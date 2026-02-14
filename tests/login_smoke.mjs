import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const email = process.env.SMOKE_EMAIL;
const pass = process.env.SMOKE_PASS;

if (!url || !key || !email || !pass) throw new Error("Need VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SMOKE_EMAIL, SMOKE_PASS");

const supa = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await supa.auth.signInWithPassword({ email, password: pass });

console.log("ok?", !error);
console.log("error?", error?.message);
console.log("user.id", data?.user?.id);
