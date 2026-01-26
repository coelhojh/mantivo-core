import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Mantivo — Supabase Client Definitivo
 *
 * Prioridade de configuração (do mais “profissional” para o mais “operacional”):
 * 1) Variáveis de ambiente (Vite)  -> .env.local / Vercel Env Vars
 * 2) LocalStorage (configurado pela UI técnica)
 *
 * Observações:
 * - NUNCA use service_role no front.
 * - URL correta: https://<project-ref>.supabase.co
 * - Key correta: anon public key (começa tipicamente com "eyJ...")
 */

// =============================================================================
// ENV (Vite)
// =============================================================================
const ENV_SUPABASE_URL: string = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
const ENV_SUPABASE_ANON_KEY: string = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();

// =============================================================================
// LocalStorage keys (UI técnica do Mantivo)
// =============================================================================
export const STORAGE_URL_KEY = "mantivo_config_url";
export const STORAGE_KEY_KEY = "mantivo_config_key";

// =============================================================================
// Helpers de validação
// =============================================================================
function normalizeUrl(url: string): string {
  return (url ?? "").trim().replace(/\/+$/, ""); // remove barra final
}

function looksLikeSupabaseUrl(url: string): boolean {
  const u = normalizeUrl(url);
  // Formato típico: https://xxxx.supabase.co
  return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(u);
}

function looksLikeJwt(key: string): boolean {
  const k = (key ?? "").trim();
  // JWT costuma ter 2 pontos (header.payload.signature) e começar com "eyJ"
  return k.startsWith("eyJ") && k.split(".").length >= 3 && k.length > 50;
}

function safeGetLocalStorage(key: string): string {
  try {
    return (localStorage.getItem(key) ?? "").trim();
  } catch {
    return "";
  }
}

function safeSetLocalStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // não falhar o app por causa de storage
  }
}

function safeRemoveLocalStorage(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // noop
  }
}

export type SupabaseConfig = {
  source: "env" | "localStorage" | "none";
  url: string;
  anonKey: string;
  reason?: string; // diagnóstico humano
};

export function getActiveConfig(): SupabaseConfig {
  // 1) ENV (preferencial)
  if (ENV_SUPABASE_URL && ENV_SUPABASE_ANON_KEY) {
    const url = normalizeUrl(ENV_SUPABASE_URL);
    const key = ENV_SUPABASE_ANON_KEY;

    if (!looksLikeSupabaseUrl(url)) {
      return { source: "none", url: "", anonKey: "", reason: "ENV: URL inválida (esperado https://<ref>.supabase.co)" };
    }
    if (!looksLikeJwt(key)) {
      return { source: "none", url: "", anonKey: "", reason: "ENV: anon key inválida (parece não ser JWT/anon public key)" };
    }

    // Sincroniza ENV -> LocalStorage (ajuda outras partes do app e diagnósticos)
    safeSetLocalStorage(STORAGE_URL_KEY, url);
    safeSetLocalStorage(STORAGE_KEY_KEY, key);

    return { source: "env", url, anonKey: key };
  }

  // 2) LocalStorage (UI)
  const cachedUrl = normalizeUrl(safeGetLocalStorage(STORAGE_URL_KEY));
  const cachedKey = safeGetLocalStorage(STORAGE_KEY_KEY);

  if (cachedUrl && cachedKey) {
    if (!looksLikeSupabaseUrl(cachedUrl)) {
      return { source: "none", url: "", anonKey: "", reason: "LocalStorage: URL inválida (esperado https://<ref>.supabase.co)" };
    }
    if (!looksLikeJwt(cachedKey)) {
      return { source: "none", url: "", anonKey: "", reason: "LocalStorage: key inválida (parece não ser anon public key)" };
    }
    return { source: "localStorage", url: cachedUrl, anonKey: cachedKey };
  }

  return { source: "none", url: "", anonKey: "", reason: "Sem configuração: defina .env.local (recomendado) ou configure via UI técnica" };
}

// =============================================================================
// Singleton do Supabase client + reset controlado
// =============================================================================
let supabaseInstance: SupabaseClient | null = null;
let supabaseInstanceSignature: string | null = null;

function signature(url: string, anonKey: string) {
  // assinatura simples para evitar recriar client sem necessidade
  return `${url}::${anonKey.slice(0, 16)}::${anonKey.length}`;
}

export function getSupabase(): SupabaseClient | null {
  const cfg = getActiveConfig();
  if (cfg.source === "none") return null;

  const sig = signature(cfg.url, cfg.anonKey);

  // Se mudou a configuração, recria o client
  if (!supabaseInstance || supabaseInstanceSignature !== sig) {
    try {
      supabaseInstance = createClient(cfg.url, cfg.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      });
      supabaseInstanceSignature = sig;
    } catch (e) {
      console.error("Mantivo: erro ao inicializar Supabase client:", e);
      supabaseInstance = null;
      supabaseInstanceSignature = null;
      return null;
    }
  }

  return supabaseInstance;
}

export function isSupabaseConfigured(): boolean {
  const cfg = getActiveConfig();
  return cfg.source !== "none" && !!cfg.url && !!cfg.anonKey;
}

/**
 * Salva config via UI (LocalStorage) e reinicia o app.
 * Observação: se ENV estiver definido, ele continuará tendo prioridade.
 */
export function saveSupabaseConfig(newUrl: string, newAnonKey: string) {
  const url = normalizeUrl(newUrl);
  const key = (newAnonKey ?? "").trim();

  if (!looksLikeSupabaseUrl(url)) {
    throw new Error("URL do Supabase inválida. Use o Project URL (https://<ref>.supabase.co).");
  }
  if (!looksLikeJwt(key)) {
    throw new Error("Chave inválida. Use a anon public key (Settings → API) e não a service_role.");
  }

  safeSetLocalStorage(STORAGE_URL_KEY, url);
  safeSetLocalStorage(STORAGE_KEY_KEY, key);

  // força recriação do client
  supabaseInstance = null;
  supabaseInstanceSignature = null;

  window.location.reload();
}

export function clearSupabaseConfig() {
  safeRemoveLocalStorage(STORAGE_URL_KEY);
  safeRemoveLocalStorage(STORAGE_KEY_KEY);

  supabaseInstance = null;
  supabaseInstanceSignature = null;

  window.location.reload();
}

/**
 * Diagnóstico rápido para UI/Support.
 * Não expõe a chave completa, apenas metadados.
 */
export function getSupabaseDiagnostics() {
  const cfg = getActiveConfig();
  const key = cfg.anonKey || "";
  return {
    configured: cfg.source !== "none",
    source: cfg.source,
    url: cfg.url,
    keyPrefix: key ? key.slice(0, 6) : "",
    keyLength: key ? key.length : 0,
    reason: cfg.reason ?? "",
  };
}

/**
 * Ping simples para diferenciar:
 * - URL errada vs
 * - anon key errada
 *
 * Retornos:
 * - ok: true  => conectividade/credenciais plausíveis
 * - ok: false => ver status e message
 */
export async function testSupabaseConnection(): Promise<{ ok: boolean; status?: number; message?: string }> {
  const cfg = getActiveConfig();
  if (cfg.source === "none") {
    return { ok: false, message: cfg.reason || "Supabase não configurado" };
  }

  try {
    const res = await fetch(`${cfg.url}/rest/v1/`, {
      headers: {
        apikey: cfg.anonKey,
        Authorization: `Bearer ${cfg.anonKey}`,
      },
    });

    // 401 normalmente = key errada para esse projeto
    // 404 aqui ainda pode indicar “ok” (endpoint base), mas a requisição chegou e autenticou cabeçalhos
    if (res.status === 401) return { ok: false, status: 401, message: "401 Unauthorized: anon key inválida para este projeto" };
    if (res.status >= 500) return { ok: false, status: res.status, message: "Erro no Supabase (5xx)" };

    return { ok: true, status: res.status };
  } catch (e: any) {
    return { ok: false, message: e?.message || "Falha de rede ao alcançar Supabase" };
  }
}
