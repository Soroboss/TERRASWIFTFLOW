import type { Client, Deal, Profile, Property } from "@/types/database";
import type {
  DealFinancials,
  Payment,
  PaymentSchedule,
  ScheduleWithPayments,
} from "@/types/entities";

export interface ActiveDealBlock {
  blocked: true;
  reason: string;
  deal: Deal & {
    client?: Pick<Client, "full_name"> | null;
    agent?: Pick<Profile, "full_name"> | null;
  };
}

export interface PropertyAvailable {
  blocked: false;
  property: Property;
}

export type PropertyDealCheck = ActiveDealBlock | PropertyAvailable;

export function buildScheduleWithPayments(
  schedules: PaymentSchedule[],
  payments: Payment[]
): ScheduleWithPayments[] {
  const today = new Date().toISOString().slice(0, 10);

  return schedules.map((schedule) => {
    const paid_amount = payments
      .filter((p) => p.schedule_id === schedule.id)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const is_paid = paid_amount >= Number(schedule.amount_due);
    const is_overdue = !is_paid && schedule.due_date < today;

    return {
      ...schedule,
      amount_due: Number(schedule.amount_due),
      paid_amount,
      is_paid,
      is_overdue,
    };
  });
}

export function buildDealFinancials(
  deal: Deal,
  schedules: PaymentSchedule[],
  payments: Payment[]
): DealFinancials {
  const enriched = buildScheduleWithPayments(schedules, payments);
  const total_paid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const total_amount = Number(deal.total_amount);
  const remaining = Math.max(0, total_amount - total_paid);
  const next_schedule =
    enriched.find((s) => !s.is_paid) ?? null;

  return {
    total_amount,
    total_paid,
    remaining,
    next_schedule,
    schedules: enriched,
  };
}

export function propertyAvailabilityMessage(
  property: Property,
  activeDeal?: (Deal & { client?: { full_name: string } | null; agent?: { full_name: string } | null }) | null
): string {
  if (activeDeal) {
    const holder = activeDeal.client?.full_name ?? "Client inconnu";
    const agent = activeDeal.agent?.full_name ?? "Agent inconnu";
    return `Ce bien est déjà ${property.status === "vendu" ? "vendu" : "réservé"} — vente ${activeDeal.status === "solde" ? "soldée" : "en cours"} par ${agent} pour ${holder}.`;
  }
  if (property.status === "reserve") {
    return "Ce bien est réservé. Aucune nouvelle vente n'est possible.";
  }
  if (property.status === "vendu") {
    return "Ce bien est déjà vendu. Anti-double-vente activé.";
  }
  return "";
}
