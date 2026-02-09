import { useEffect, useMemo, useState } from "react";

/**
 * Persisted sidebar collapse state (per user/browser).
 * If userId is not provided, uses "anon".
 */
export function useSidebarState(userId?: string | null) {
  const storageKey = useMemo(() => {
    const uid = userId && userId.trim().length > 0 ? userId : "anon";
    return `mantivo:sidebarCollapsed:${uid}`;
  }, [userId]);

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw === null) return false; // default expanded
      return raw === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, collapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed, storageKey]);

  const toggle = () => setCollapsed((v) => !v);

  return { collapsed, setCollapsed, toggle, storageKey };
}
