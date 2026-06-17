import type { Plan } from "@/types/database";

export const TRIAL_DAYS = 14;

export type PublicPlanId = Extract<Plan, "starter" | "pro">;

export interface PricingPlan {
  id: PublicPlanId;
  name: string;
  tagline: string;
  priceMonthly: number;
  trialDays: number;
  highlighted?: boolean;
  badge?: string;
  features: string[];
  limits: string[];
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Pour lotisseurs et petites promoteurs",
    priceMonthly: 25_000,
    trialDays: TRIAL_DAYS,
    features: [
      "Biens & plans de masse illimités",
      "Clients, ventes & échéanciers",
      "Encaissements Wave, Orange Money, MTN MoMo",
      "Reçus & contrats PDF",
      "Relances automatiques",
    ],
    limits: ["Jusqu'à 3 agents", "1 site / programme"],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Pour promoteurs en croissance",
    priceMonthly: 55_000,
    trialDays: TRIAL_DAYS,
    highlighted: true,
    badge: "Le plus populaire",
    features: [
      "Tout le plan Starter",
      "Agents illimités",
      "Programmes & sites multiples",
      "Tableau de bord consolidé",
      "Support prioritaire WhatsApp",
      "Export Excel des encaissements",
    ],
    limits: ["Idéal à partir de 50 lots actifs"],
  },
];

export function getPlanById(id: string | null | undefined): PricingPlan {
  return PRICING_PLANS.find((p) => p.id === id) ?? PRICING_PLANS[0];
}

export function getMaxAgentsForPlan(plan: string | null | undefined): number | null {
  return plan === "starter" ? 3 : null;
}

export function formatFcfa(amount: number): string {
  return new Intl.NumberFormat("fr-CI").format(amount);
}
