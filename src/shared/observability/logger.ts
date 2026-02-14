type Level = "debug" | "info" | "warn" | "error";

const isProd = import.meta.env.PROD;
const isDev = import.meta.env.DEV;

type ErrorPayload = {
  message: string;
  error?: {
    name?: string;
    message: string;
    stack?: string;
  };
  extra?: Record<string, unknown>;
};

function normalizeError(err: unknown): ErrorPayload["error"] {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: isDev ? err.stack : undefined,
    };
  }
  return { message: String(err) };
}

function shouldLog(level: Level) {
  if (isProd) return level === "error";
  return true;
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (!shouldLog("debug")) return;
    console.debug(...args);
  },

  info: (...args: unknown[]) => {
    if (!shouldLog("info")) return;
    console.info(...args);
  },

  warn: (...args: unknown[]) => {
    if (!shouldLog("warn")) return;
    console.warn(...args);
  },

  error: (message: string, err?: unknown, extra?: Record<string, unknown>) => {
    if (!shouldLog("error")) return;

    const payload: ErrorPayload = {
      message,
      ...(err ? { error: normalizeError(err) } : {}),
      ...(extra ? { extra } : {}),
    };

    console.error(payload);
  },
};
