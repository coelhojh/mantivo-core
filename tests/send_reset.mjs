import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const url = process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY;
const email = process.env.RESET_EMAIL;

if (!url || !anon || !email) {
  console.error("Need VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, RESET_EMAIL");
  process.exit(1);
}

const res = await fetch(`${url}/auth/v1/recover`, {
  method: "POST",
  headers: { apikey: anon, "Content-Type": "application/json" },
  body: JSON.stringify({ email }),
});

const text = await res.text();
console.log("HTTP", res.status, res.statusText);
console.log(text);
