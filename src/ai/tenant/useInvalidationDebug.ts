import { useEffect } from "react";
import { subscribe, type Entity, type InvalidationEvent } from "./invalidationBus";

type Options = {
  enabled?: boolean;
  tenantId?: string | null;
  entities?: Entity[];
  label?: string;
};

export function useInvalidationDebug(options: Options = {}) {
  const {
    enabled = import.meta.env.DEV,
    tenantId,
    entities,
    label = "debug",
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const unsub = subscribe((ev: InvalidationEvent) => {
      if (tenantId && ev.tenantId !== tenantId) return;
      if (entities && !entities.includes(ev.entity)) return;

      console.log(
        `[invalidationBus:${label}]`,
        ev.entity,
        ev.reason,
        {
          tenantId: ev.tenantId,
          at: new Date(ev.at).toISOString(),
          source: ev.source,
        }
      );
    });

    return unsub;
  }, [enabled, tenantId, label, JSON.stringify(entities)]);
}
