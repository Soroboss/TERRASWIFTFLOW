"use server";

import { createServiceClient } from "@/lib/insforge/admin";
import { logPlatformAction } from "@/lib/actions/platform/audit";
import { requirePlatformSession } from "@/lib/platform/auth";
import type {
  GrowthPoint,
  PlatformKPIs,
  PlatformSettings,
  TenantOverview,
} from "@/types/platform";
import type { Plan } from "@/types/database";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const PLAN_PRICES: Record<Plan, number> = {
  starter: 25_000,
  pro: 55_000,
  business: 120_000,
};

async function loadSettings(): Promise<PlatformSettings> {
  const service = createServiceClient();
  const { data } = await service.database.from("platform_settings").select("key, value");

  const settings: PlatformSettings = {
    general: { trial_days: 14, support_email: "contact@terraswiftflow.ci", app_name: "TerraSwiftFlow" },
    pricing: { starter_monthly: 25_000, pro_monthly: 55_000, business_monthly: 120_000 },
  };

  for (const row of data ?? []) {
    if (row.key === "general") settings.general = row.value as PlatformSettings["general"];
    if (row.key === "pricing") settings.pricing = row.value as PlatformSettings["pricing"];
  }

  return settings;
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  await requirePlatformSession();
  return loadSettings();
}

export async function getTenantOverviews(): Promise<TenantOverview[]> {
  await requirePlatformSession();
  const service = createServiceClient();

  const { data, error } = await service.database
    .from("platform_tenant_overview")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as TenantOverview[];
}

export async function getTenantOverview(id: string): Promise<TenantOverview | null> {
  await requirePlatformSession();
  const service = createServiceClient();

  const { data } = await service.database
    .from("platform_tenant_overview")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return (data as TenantOverview | null) ?? null;
}

export async function getPlatformKPIs(): Promise<PlatformKPIs> {
  await requirePlatformSession();
  const tenants = await getTenantOverviews();
  const settings = await loadSettings();
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const activeSubscriptions = tenants.filter((t) => t.subscription_status === "active").length;
  const trialTenants = tenants.filter((t) => t.subscription_status === "trial").length;
  const pastDueTenants = tenants.filter((t) => t.subscription_status === "past_due").length;
  const suspendedTenants = tenants.filter((t) => t.suspended_at).length;
  const newTenants30d = tenants.filter(
    (t) => new Date(t.created_at).getTime() >= thirtyDaysAgo
  ).length;

  const pricing = settings.pricing;
  const estimatedMrr = tenants
    .filter((t) => t.subscription_status === "active" && !t.suspended_at)
    .reduce((sum, t) => {
      if (t.plan === "pro") return sum + pricing.pro_monthly;
      if (t.plan === "business") return sum + pricing.business_monthly;
      return sum + pricing.starter_monthly;
    }, 0);

  const everTrialed = tenants.length;
  const converted = tenants.filter((t) =>
    ["active", "past_due", "cancelled"].includes(t.subscription_status)
  ).length;
  const trialConversionRate =
    everTrialed > 0 ? Math.round((converted / everTrialed) * 100) : 0;

  return {
    totalTenants: tenants.length,
    activeSubscriptions,
    trialTenants,
    pastDueTenants,
    suspendedTenants,
    newTenants30d,
    estimatedMrr,
    trialConversionRate,
  };
}

export async function getGrowthSeries(weeks = 12): Promise<GrowthPoint[]> {
  await requirePlatformSession();
  const service = createServiceClient();

  const { data: orgs } = await service.database
    .from("organizations")
    .select("created_at, subscription_status")
    .order("created_at", { ascending: true });

  const points: GrowthPoint[] = [];
  const now = new Date();

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const label = format(weekStart, "d MMM", { locale: fr });
    const signups = (orgs ?? []).filter((o) => {
      const d = new Date(o.created_at);
      return d >= weekStart && d < weekEnd;
    }).length;

    const activations = (orgs ?? []).filter((o) => {
      const d = new Date(o.created_at);
      return d >= weekStart && d < weekEnd && o.subscription_status === "active";
    }).length;

    points.push({ label, signups, activations });
  }

  return points;
}

export async function getPlanDistribution(): Promise<{ plan: Plan; count: number }[]> {
  const tenants = await getTenantOverviews();
  const plans: Plan[] = ["starter", "pro", "business"];
  return plans.map((plan) => ({
    plan,
    count: tenants.filter((t) => t.plan === plan).length,
  }));
}
