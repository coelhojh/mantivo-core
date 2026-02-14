export type Entity =
  | "condos"
  | "providers"
  | "maintenances"
  | "categories"
  | "profiles"
  | "tenants"
  | "tenant_members"
  | "attachments";

export type InvalidationEvent = {
  tenantId: string;
  entity: Entity;
  reason: "realtime" | "manual" | "system";
  at: number;
  source?: string;
};

export type InvalidationListener = (event: InvalidationEvent) => void;

const listeners = new Set<InvalidationListener>();

export function subscribe(fn: InvalidationListener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function emit(event: InvalidationEvent): void {
  for (const fn of listeners) {
    try {
      fn(event);
    } catch (err) {
      console.warn("[invalidationBus] listener error:", err);
    }
  }
}

export function emitMany(events: InvalidationEvent[]): void {
  for (const e of events) emit(e);
}
