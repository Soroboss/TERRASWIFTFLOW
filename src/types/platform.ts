import type { Plan, SubscriptionStatus } from "@/types/database";

export type PlatformRole = "super_admin" | "support" | "billing";

export interface PlatformUser {
  id: string;
  email: string;
  full_name: string;
  role: PlatformRole;
  active: boolean;
  created_at: string;
}

export interface PlatformAuditEntry {
  id: string;
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TenantOverview {
  id: string;
  name: string;
  plan: Plan;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  billing_email: string | null;
  suspended_at: string | null;
  notes: string | null;
  created_at: string;
  active_users: number;
  properties_count: number;
  clients_count: number;
  active_deals: number;
  closed_deals: number;
  revenue_30d: number;
}

export interface PlatformKPIs {
  totalTenants: number;
  activeSubscriptions: number;
  trialTenants: number;
  pastDueTenants: number;
  suspendedTenants: number;
  newTenants30d: number;
  estimatedMrr: number;
  trialConversionRate: number;
}

export interface GrowthPoint {
  label: string;
  signups: number;
  activations: number;
}

export interface PlatformSettings {
  general: {
    trial_days: number;
    support_email: string;
    app_name: string;
  };
  pricing: {
    starter_monthly: number;
    pro_monthly: number;
    business_monthly: number;
  };
}

export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  super_admin: "Super administrateur",
  support: "Support client",
  billing: "Facturation",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trial: "Essai",
  active: "Actif",
  past_due: "Impayé",
  cancelled: "Résilié",
};
