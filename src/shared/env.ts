function required(name: string): string {
  const v = (import.meta.env as any)[name];
  if (typeof v !== "string" || v.trim() === "") {
    throw new Error(`[env] Missing ${name}`);
  }
  return v.trim();
}

export const env = {
  SUPABASE_URL: required("VITE_SUPABASE_URL"),
  SUPABASE_ANON_KEY: required("VITE_SUPABASE_ANON_KEY"),
};
