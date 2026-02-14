type StorageLike = Pick<Storage, "key" | "getItem" | "setItem" | "removeItem" | "length">;

export function tenantKey(tenantId: string, key: string): string {
  return `tenant:${tenantId}:${key}`;
}

function safeRemove(storage: StorageLike, k: string) {
  try {
    storage.removeItem(k);
  } catch {
    // noop
  }
}

function safeKeys(storage: StorageLike): string[] {
  try {
    const out: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k) out.push(k);
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Remove chaves com prefixo `tenant:${tenantId}:` em localStorage e/ou sessionStorage.
 * - NÃO mexe em chaves globais fora do prefixo
 * - NÃO limpa cg_user_cache nem nada genérico
 */
export function clearTenantCache(
  tenantId: string,
  opts?: {
    prefixes?: string[]; // opcional: restringir a subprefixos dentro do tenant
    includeSession?: boolean;
    includeLocal?: boolean;
  }
): void {
  const prefixBase = `tenant:${tenantId}:`;
  const includeLocal = opts?.includeLocal ?? true;
  const includeSession = opts?.includeSession ?? true;
  const prefixes = opts?.prefixes?.length
    ? opts.prefixes.map((p) => (p.startsWith(prefixBase) ? p : `${prefixBase}${p}`))
    : null;

  const storages: StorageLike[] = [];
  if (includeLocal) storages.push(localStorage);
  if (includeSession) storages.push(sessionStorage);

  for (const storage of storages) {
    const keys = safeKeys(storage);
    for (const k of keys) {
      if (!k.startsWith(prefixBase)) continue;

      // se vier lista de prefixes, só remove os que baterem
      if (prefixes && !prefixes.some((p) => k.startsWith(p))) continue;

      // proteção extra (não deveria ocorrer pois não usa nosso prefix)
      if (k === "cg_user_cache") continue;

      safeRemove(storage, k);
    }
  }
}
