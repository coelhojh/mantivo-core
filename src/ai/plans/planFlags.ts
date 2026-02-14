export type Plan = "free" | "pro" | "business";

export type Feature =
  | "realtime"
  | "attachments"
  | "export"
  | "multi_condo"
  | "advanced_filters";

export type PlanCaps = {
  plan: Plan;
  maxCondos: number;
  maxProviders: number;
  maxMaintenancesPerMonth: number;
  maxAttachmentsPerMaintenance: number;
};

export type PlanContext = {
  isSuperAdmin?: boolean;
  tenantId?: string | null;
  userId?: string | null;

  // futuro: backend poderá informar
  plan?: Plan;
};

const DEFAULT_FREE: PlanCaps = {
  plan: "free",
  maxCondos: 1,
  maxProviders: 20,
  maxMaintenancesPerMonth: 50,
  maxAttachmentsPerMaintenance: 3,
};

const DEFAULT_PRO: PlanCaps = {
  plan: "pro",
  maxCondos: 10,
  maxProviders: 200,
  maxMaintenancesPerMonth: 500,
  maxAttachmentsPerMaintenance: 20,
};

const DEFAULT_BUSINESS: PlanCaps = {
  plan: "business",
  maxCondos: 999,
  maxProviders: 9999,
  maxMaintenancesPerMonth: 99999,
  maxAttachmentsPerMaintenance: 999,
};

export function getPlanCaps(ctx: PlanContext = {}): PlanCaps {
  if (ctx.isSuperAdmin) return DEFAULT_BUSINESS;

  const plan: Plan = ctx.plan ?? "free";

  if (plan === "business") return DEFAULT_BUSINESS;
  if (plan === "pro") return DEFAULT_PRO;
  return DEFAULT_FREE;
}

export function isFeatureEnabled(feature: Feature, ctx: PlanContext = {}): boolean {
  if (ctx.isSuperAdmin) return true;

  const plan = (ctx.plan ?? "free") as Plan;

  switch (feature) {
    case "realtime":
      // decisão arquitetural inicial:
      // realtime só PRO+ (reduz custo e complexidade no free)
      return plan !== "free";

    case "attachments":
      return true;

    case "export":
      return plan !== "free";

    case "multi_condo":
      return plan !== "free";

    case "advanced_filters":
      return plan !== "free";

    default:
      return false;
  }
}
