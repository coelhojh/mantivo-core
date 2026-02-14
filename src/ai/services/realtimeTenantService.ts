import { getSupabase } from "./supabaseClient";
import { emitMany, type Entity, type InvalidationEvent } from "../tenant/invalidationBus";


function requireSupabase() {
  const s = getSupabase();
  if (!s) throw new Error("Supabase not configured");
  return s;
}


// Tabelas que queremos observar nesta fase (incremental)
const TABLE_TO_ENTITY: Record<string, Entity> = {
  maintenances: "maintenances",
  providers: "providers",
  condos: "condos",
  attachments: "attachments",
};

type PendingKey = `${string}:${Entity}`;

let activeTenantId: string | null = null;
let activeChannel: any | null = null;

// coalesce simples para evitar tempestade
const pending = new Map<PendingKey, InvalidationEvent>();
let flushTimer: number | null = null;

function scheduleFlush(windowMs: number) {
  if (flushTimer) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    if (pending.size === 0) return;
    const batch = Array.from(pending.values());
    pending.clear();
    emitMany(batch);
  }, windowMs);
}

function queue(tenantId: string, entity: Entity, source: string) {
  const key: PendingKey = `${tenantId}:${entity}`;
  pending.set(key, {
    tenantId,
    entity,
    reason: "realtime",
    at: Date.now(),
    source,
  });
  scheduleFlush(350); // 250–500ms conforme guia; escolhi 350ms
}

/**
 * startTenantRealtime
 * - cria 1 channel por tenantId ativo
 * - escuta INSERT/UPDATE/DELETE via Postgres Changes
 * - emite invalidationBus (coalescido)
 * - retorna teardown (stop)
 *
 * Se falhar, não quebra o app.
 */
export function startTenantRealtime(tenantId: string): () => void {
  // teardown defensivo se chamarem duas vezes
  stopTenantRealtime();

  activeTenantId = tenantId;

  try {
    const channelName = `tenant:${tenantId}`;


      const supabase = requireSupabase();
    const ch = supabase.channel(channelName);

    // adiciona listeners para cada tabela relevante
    for (const [table, entity] of Object.entries(TABLE_TO_ENTITY)) {
      ch.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          // qualquer change nessa tabela -> invalida entidade correspondente
          queue(tenantId, entity, `supabase:${table}`);
        }
      );
    }

    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") return;
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.warn("[realtimeTenantService] channel status:", status, { tenantId });
      }
    });

    activeChannel = ch;

    return () => stopTenantRealtime();
  } catch (err) {
    console.warn("[realtimeTenantService] failed to start realtime, fallback to epoch only:", err);
    // fallback: não faz nada
    activeTenantId = null;
    activeChannel = null;
    return () => {};
  }
}

export function stopTenantRealtime(): void {
  // cancela flush pendente
  if (flushTimer) {
    window.clearTimeout(flushTimer);
    flushTimer = null;
  }
  pending.clear();

  const ch = activeChannel;
  activeChannel = null;

  const tid = activeTenantId;
  activeTenantId = null;

  if (!ch) return;

  try {
    // removeChannel é o teardown mais forte
    const supabase = getSupabase();
    if (!supabase) return;

    supabase.removeChannel(ch);
  } catch (err) {
    console.warn("[realtimeTenantService] stop error:", err, { tenantId: tid });
  }
}
