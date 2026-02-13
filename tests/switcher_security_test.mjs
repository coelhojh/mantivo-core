import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const env = process.env;

function must(k) {
  const v = env[k];
  if (!v) throw new Error(`Missing env: ${k}`);
  return v;
}

const SUPABASE_URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL || must("SUPABASE_URL");
const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || must("SUPABASE_ANON_KEY");

async function login(email, password) {
  const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { error } = await supa.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Login failed for ${email}: ${error.message}`);
  return supa;
}

async function getProfile(supa) {
  const { data: authData, error: authErr } = await supa.auth.getUser();
  if (authErr) throw new Error(`Read auth user failed: `);
  const uid = authData?.user?.id;
  if (!uid) throw new Error(`Missing auth.uid()`);

  const { data, error } = await supa
    .from("profiles")
    .select("id, email, role, active_tenant_id")
    .eq("id", uid)
    .maybeSingle();

  if (error) throw new Error(`Read profile failed: `);
  if (!data) throw new Error(`Profile row not found for uid `);
  return data;
}

async function tryDirectUpdateActiveTenant(supa, tenantId) {
  const { error } = await supa
    .from('profiles')
    .update({ active_tenant_id: tenantId })
    .eq('id', (await getProfile(supa)).id);
  return error; // expected: error due to column privilege / RLS
}

async function rpcSwitchTenant(supa, tenantId) {
  const { error } = await supa.rpc('set_active_tenant', { p_tenant_id: tenantId });
  return error;
}

async function listTenants(supa) {
  const { data, error } = await supa.from('tenants').select('id, name').limit(50);
  if (error) throw new Error(`List tenants failed: ${error.message}`);
  return data ?? [];
}

function ok(msg) { console.log(`✅ ${msg}`); }
function bad(msg) { console.log(`❌ ${msg}`); }

(async () => {
  const USER_A_EMAIL = must('USER_A_EMAIL');
  const USER_A_PASS  = must('USER_A_PASS');
  const USER_B_EMAIL = must('USER_B_EMAIL');
  const USER_B_PASS  = must('USER_B_PASS');
  const SUPER_EMAIL  = must('SUPER_EMAIL');
  const SUPER_PASS   = must('SUPER_PASS');

  const TENANT_A_ID = must('TENANT_A_ID');
  const TENANT_B_ID = must('TENANT_B_ID');

  console.log('\n== 1) USER A: direct UPDATE active_tenant_id must FAIL ==');
  const a = await login(USER_A_EMAIL, USER_A_PASS);
  let err = await tryDirectUpdateActiveTenant(a, TENANT_B_ID);
  if (err) ok(`Direct UPDATE blocked: ${err.message}`);
  else bad('Direct UPDATE unexpectedly succeeded (NO-GO)');

  console.log('\n== 2) USER A: RPC switch to own tenant must OK ==');
  err = await rpcSwitchTenant(a, TENANT_A_ID);
  if (err) bad(`RPC switch to TENANT_A failed: ${err.message}`);
  else ok('RPC switch to TENANT_A OK');

  console.log('\n== 3) USER A: RPC switch to чужo tenant must FAIL ==');
  err = await rpcSwitchTenant(a, TENANT_B_ID);
  if (err) ok(`RPC blocked as expected: ${err.message}`);
  else bad('RPC switch to TENANT_B unexpectedly succeeded (NO-GO)');

  console.log('\n== 4) USER B: RPC switch to TENANT_B must OK, TENANT_A must FAIL ==');
  const b = await login(USER_B_EMAIL, USER_B_PASS);
  err = await rpcSwitchTenant(b, TENANT_B_ID);
  if (err) bad(`USER B switch to TENANT_B failed: ${err.message}`);
  else ok('USER B switch to TENANT_B OK');

  err = await rpcSwitchTenant(b, TENANT_A_ID);
  if (err) ok(`USER B blocked to TENANT_A as expected: ${err.message}`);
  else bad('USER B switch to TENANT_A unexpectedly succeeded (NO-GO)');

  console.log('\n== 5) SUPERADMIN: list tenants should show MANY (or at least both) ==');
  const s = await login(SUPER_EMAIL, SUPER_PASS);
  const prof = await getProfile(s);
  console.log('Super profile:', prof);

  const tenants = await listTenants(s);
  console.log(`Super can see ${tenants.length} tenants`);
  if (tenants.length >= 2) ok('Superadmin can list tenants (OK)');
  else bad('Superadmin tenant list too small — verify tenants_select_superadmin policy');

  console.log('\n== 6) SUPERADMIN: RPC switch to TENANT_A then TENANT_B must OK ==');
  err = await rpcSwitchTenant(s, TENANT_A_ID);
  if (err) bad(`SUPER switch to TENANT_A failed: ${err.message}`);
  else ok('SUPER switch to TENANT_A OK');

  err = await rpcSwitchTenant(s, TENANT_B_ID);
  if (err) bad(`SUPER switch to TENANT_B failed: ${err.message}`);
  else ok('SUPER switch to TENANT_B OK');

  console.log('\nDONE ✅');
})().catch((e) => {
  console.error('\nFAILED:', e.message);
  process.exit(1);
});
