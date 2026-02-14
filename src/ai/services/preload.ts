type IdleCallbackHandle = any;

type IdleCallback = (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void;

export function idle(cb: () => void, timeoutMs = 1500): IdleCallbackHandle {
  const w = window as any;

  if (typeof w.requestIdleCallback === "function") {
    return w.requestIdleCallback(
      (deadline: any) => {
        try { cb(); } catch {}
      },
      { timeout: timeoutMs }
    );
  }

  // Fallback: não perfeito, mas mantém o comportamento “não-bloqueante”
  return window.setTimeout(() => {
    try { cb(); } catch {}
  }, 250);
}

export function preload<T>(fn: () => Promise<T>, timeoutMs = 1500): void {
  idle(() => {
    void fn().catch(() => {});
  }, timeoutMs);
}
