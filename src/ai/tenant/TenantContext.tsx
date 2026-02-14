import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { emitMany, type Entity } from "./invalidationBus";
import { startTenantRealtime, stopTenantRealtime } from "../services/realtimeTenantService";

const CRITICAL_ENTITIES: Entity[] = [
  "maintenances",
  "providers",
  "condos",
  "categories",
];

type TenantChangeReason = "boot" | "switcher" | "restore" | "unknown";

type TenantContextValue = {
  tenantId: string | null;
  tenantEpoch: number;
  setTenantId: (next: string | null, opts?: { reason?: TenantChangeReason }) => void;

  // evento interno simples (não depende de libs)
  onTenantChange: (fn: (tenantId: string | null) => void) => () => void;
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider(props: { initialTenantId?: string | null; children: React.ReactNode }) {
  const [tenantId, _setTenantId] = useState<string | null>(props.initialTenantId ?? null);
  const [tenantEpoch, setTenantEpoch] = useState<number>(0);

  // mini event-bus interno
  const listenersRef = useRef(new Set<(tenantId: string | null) => void>());

  const onTenantChange = useCallback((fn: (tenantId: string | null) => void) => {
    listenersRef.current.add(fn);
    return () => listenersRef.current.delete(fn);
  }, []);

  const setTenantId = useCallback(
    (next: string | null, opts?: { reason?: TenantChangeReason }) => {
      _setTenantId((prev) => {
        if (prev === next) return prev;
          setTenantEpoch((e) => e + 1);
          if (next) {
            emitMany(
              CRITICAL_ENTITIES.map((entity) => ({
                tenantId: next,
                entity,
                reason: "system" as const,
                at: Date.now(),
                source: "TenantProvider.setTenantId",
              }))
            );
          }

// dispara evento interno
          listenersRef.current.forEach((fn) => {
            try {
              fn(next);
            } catch (e) {
              console.error("[TenantContext] onTenantChange listener error", e);
            }
          });
          // se precisar logar motivo depois, fica aqui (sem efeitos colaterais agora)
        void opts;
        return next;
      });
    },
    []
  );

  useEffect(() => {
    if (!tenantId) return;

    const stop = startTenantRealtime(tenantId);
    return () => {
      try {
        stop?.();
      } finally {
        stopTenantRealtime();
      }
    };
  }, [tenantId]);

  const value = useMemo<TenantContextValue>(
    () => ({ tenantId, tenantEpoch, setTenantId, onTenantChange }),
    [tenantId, tenantEpoch, setTenantId, onTenantChange]
  );

  return <TenantContext.Provider value={value}>{props.children}</TenantContext.Provider>;
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within <TenantProvider />");
  return ctx;
}
