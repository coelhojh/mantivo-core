import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const email = process.env.RESEND_EMAIL;

if (!url || !key || !email) {
  console.error("Need VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, RESEND_EMAIL");
  process.exit(1);
}

const supabase = createClient(url, key);

const { data, error } = await supabase.auth.resend({
  type: "signup",
  email,
});

if (error) {
  console.error("FAILED:", error.message);
  process.exit(1);
}

console.log("✅ Confirmation email resent to:", email);
console.log("Response:", data);
