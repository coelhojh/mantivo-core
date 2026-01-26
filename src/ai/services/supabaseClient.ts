
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ==============================================================================
// 💾 CONFIGURAÇÃO DEFINITIVA (INSIRA SEUS DADOS AQUI)
// ==============================================================================
// Preencha as aspas abaixo com suas credenciais do painel Supabase (Settings > API)
const DEFAULT_SUPABASE_URL: string = "";
const DEFAULT_SUPABASE_KEY: string = "";


// Chaves de armazenamento local para sincronia
export const STORAGE_URL_KEY = 'mantivo_config_url';
export const STORAGE_KEY_KEY = 'mantivo_config_key';

const getEnv = () => {
  // 1. PRIORIDADE MÁXIMA: Chaves definitivas inseridas no código acima
  if (DEFAULT_SUPABASE_URL && DEFAULT_SUPABASE_KEY) {
      // Sincroniza com localStorage para garantir que outros serviços vejam a configuração
      try {
          localStorage.setItem(STORAGE_URL_KEY, DEFAULT_SUPABASE_URL.trim());
          localStorage.setItem(STORAGE_KEY_KEY, DEFAULT_SUPABASE_KEY.trim());
      } catch (e) {
          console.warn("Falha ao sincronizar chaves definitivas no LocalStorage");
      }
      return { url: DEFAULT_SUPABASE_URL.trim(), key: DEFAULT_SUPABASE_KEY.trim() };
  }

  // 2. FALLBACK: Variáveis de ambiente (.env)
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey && envUrl.startsWith('http')) {
    return { url: envUrl, key: envKey };
  }

  // 3. SEGUNDO FALLBACK: LocalStorage (Configurado via UI)
  try {
    const cachedUrl = localStorage.getItem(STORAGE_URL_KEY);
    const cachedKey = localStorage.getItem(STORAGE_KEY_KEY);
    if (cachedUrl && cachedKey && cachedUrl.startsWith('http')) {
      return { url: cachedUrl.trim(), key: cachedKey.trim() };
    }
  } catch (e) {
    console.error("Erro ao acessar LocalStorage", e);
  }

  return { url: '', key: '' };
};

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase() {
  if (!supabaseInstance) {
    const { url, key } = getEnv();
    if (url && key) {
      try {
        supabaseInstance = createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false
          }
        });
      } catch (e) {
        console.error("Erro ao inicializar Supabase:", e);
        return null;
      }
    }
  }
  return supabaseInstance;
}

export function isSupabaseConfigured(): boolean {
    const { url, key } = getEnv();
    return !!(url && key && url.startsWith('http'));
}

export function saveSupabaseConfig(newUrl: string, newKey: string) {
    localStorage.setItem(STORAGE_URL_KEY, newUrl.trim());
    localStorage.setItem(STORAGE_KEY_KEY, newKey.trim());
    window.location.reload();
}

export function clearSupabaseConfig() {
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_KEY_KEY);
    window.location.reload();
}

export function getActiveConfig() {
    return getEnv();
}
