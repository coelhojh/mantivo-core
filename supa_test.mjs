import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const commonEmail = process.env.TEST_USER_EMAIL;
const commonPassword = process.env.TEST_USER_PASSWORD;

const adminEmail = process.env.TEST_ADMIN_EMAIL;
const adminPassword = process.env.TEST_ADMIN_PASSWORD;

if (!commonEmail || !commonPassword) {
  console.error("Missing TEST_USER_EMAIL or TEST_USER_PASSWORD");
  process.exit(1);
}
if (!adminEmail || !adminPassword) {
  console.error("Missing TEST_ADMIN_EMAIL or TEST_ADMIN_PASSWORD");
  process.exit(1);
}

const makeClient = () => createClient(url, key, { auth: { persistSession: false } });

async function signIn(supabase, email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function readProfile(supabase, userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,role,active_tenant_id")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

async function listCondosRls(supabase) {
  const { data, error } = await supabase
    .from("condos")
    .select("id,tenant_id,name")
    .order("name", { ascending: true })
    .limit(50);

  if (error) throw error;
  return data || [];
}

async function listCondosFiltered(supabase, tenantId) {
  if (!tenantId) return [];
  const { data, error } = await supabase
    .from("condos")
    .select("id,tenant_id,name")
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true })
    .limit(50);

  if (error) throw error;
  return data || [];
}

async function setActiveTenant(supabase, userId, tenantId) {
  const { error } = await supabase
    .from("profiles")
    .update({ active_tenant_id: tenantId })
    .eq("id", userId);

  if (error) throw error;
}

async function runForUser(label, email, password, { allowSwitchTenant = false } = {}) {
  const supabase = makeClient();

  const auth = await signIn(supabase, email, password);
  const userId = auth.user?.id;
  console.log(`\n=== ${label} ===`);
  console.log("✅ logged in:", userId);

  const profile1 = await readProfile(supabase, userId);
  console.log("✅ profile:", profile1);

  const condosAll1 = await listCondosRls(supabase);
  console.log("✅ condos (RLS) rows:", condosAll1.length);
  console.log("sample:", condosAll1.slice(0, 5));

  const condosFiltered1 = await listCondosFiltered(supabase, profile1.active_tenant_id);
  console.log("✅ condos (filtered active_tenant_id) rows:", condosFiltered1.length);

  // Para super_admin: se quiser testar troca e tiver tenant_id disponível, alterna.
  if (allowSwitchTenant) {
    const distinctTenants = Array.from(
      new Set((condosAll1 || []).map((c) => c.tenant_id).filter(Boolean))
    );

    if (distinctTenants.length >= 1) {
      const current = profile1.active_tenant_id || null;
      const next = distinctTenants.find((t) => t !== current) || distinctTenants[0];

      console.log("🔁 switching active_tenant_id:", { current, next });
      await setActiveTenant(supabase, userId, next);

      const profile2 = await readProfile(supabase, userId);
      console.log("✅ profile after switch:", profile2);

      const condosAll2 = await listCondosRls(supabase);
      console.log("✅ condos (RLS) rows after switch:", condosAll2.length);

      const condosFiltered2 = await listCondosFiltered(supabase, profile2.active_tenant_id);
      console.log("✅ condos (filtered active_tenant_id) rows after switch:", condosFiltered2.length);
    } else {
      console.log("⚠️ Não encontrei tenant_id suficiente em condos para testar switch.");
    }
  }

  await supabase.auth.signOut();
}

try {
  await runForUser("COMMON USER", commonEmail, commonPassword, { allowSwitchTenant: false });
  await runForUser("SUPER ADMIN", adminEmail, adminPassword, { allowSwitchTenant: true });
  console.log("\n✅ supa_test OK");
} catch (e) {
  console.error("\n❌ supa_test FAILED:", e);
  process.exit(2);
}
