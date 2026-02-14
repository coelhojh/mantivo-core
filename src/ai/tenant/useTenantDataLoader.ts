// src/ai/tenant/useTenantDataLoader.ts
import { useEffect, useRef } from "react";
import { useTenant } from "./TenantContext";
import { subscribe } from "./invalidationBus";

export type Entity = string;

type TenantDataLoaderOptions = {
  entities: Entity[];
  reload: () => void | Promise<void>;
  debounceMs?: number; // default 300ms
};

export function useTenantDataLoader(options: TenantDataLoaderOptions) {
  const { tenantId, tenantEpoch } = useTenant();
  const { entities, reload, debounceMs = 300 } = options;

  const reloadRef = useRef(reload);
  const entitiesRef = useRef<Entity[]>(entities);
  const debounceMsRef = useRef<number>(debounceMs);

  const timerRef = useRef<number | null>(null);
  const lastEpochRef = useRef<number | null>(null);

  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);

  useEffect(() => {
    entitiesRef.current = Array.isArray(entities) ? entities : [];
  }, [entities]);

  useEffect(() => {
    debounceMsRef.current = typeof debounceMs === "number" ? debounceMs : 300;
  }, [debounceMs]);

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const scheduleReload = (reason: string) => {
    clearTimer();
    timerRef.current = window.setTimeout(async () => {
      try {
        await reloadRef.current?.();
      } catch (err) {
        console.error("[useTenantDataLoader] reload failed:", { reason, err });
      }
    }, debounceMsRef.current);
  };

  // (1) tenantEpoch mudou => reload
  useEffect(() => {
    try {
      if (!tenantId) return;

      if (lastEpochRef.current === null) {
        lastEpochRef.current = tenantEpoch ?? null;
        return;
      }

      if (tenantEpoch !== lastEpochRef.current) {
        lastEpochRef.current = tenantEpoch ?? null;
        scheduleReload("tenantEpoch_changed");
      }
    } catch (err) {
      console.error("[useTenantDataLoader] tenantEpoch watcher error:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, tenantEpoch]);

  // (2) invalidationBus => reload (se bater tenant + entity)
  useEffect(() => {
    if (!tenantId) return;

    const matchesTenant = (evt: any): boolean => {
      const evTenantId = evt?.tenantId ?? evt?.payload?.tenantId;
      if (!evTenantId) return true; // se não vier, assume tenant atual
      return String(evTenantId) === String(tenantId);
    };

    const matchesEntity = (evt: any): boolean => {
      const wanted = new Set((entitiesRef.current || []).map(String));
      if (wanted.size === 0) return true;

      const evEntities =
        evt?.entities ??
        evt?.entity ??
        evt?.payload?.entities ??
        evt?.payload?.entity;

      if (!evEntities) return false;

      if (Array.isArray(evEntities))
        return evEntities.some((e) => wanted.has(String(e)));

      return wanted.has(String(evEntities));
    };

    const handler = (evt: any) => {
      try {
        if (!matchesTenant(evt)) return;
        if (!matchesEntity(evt)) return;
        scheduleReload("invalidation_event");
      } catch (err) {
        console.error("[useTenantDataLoader] invalidation handler error:", err);
      }
    };

    let unsubscribe: (() => void) | null = null;

try {
  unsubscribe = subscribe(handler);
} catch (err) {
  console.error("[useTenantDataLoader] failed to subscribe invalidationBus:", err);
}

return () => {
  try {
    unsubscribe?.();
  } finally {
    clearTimer();
  }
};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);
}
