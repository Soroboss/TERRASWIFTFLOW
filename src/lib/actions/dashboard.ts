"use server";

import { requireSession } from "@/lib/auth";
import { buildScheduleWithPayments } from "@/lib/deals";
import { createClient } from "@/lib/supabase/server";
import type { DashboardKPIs, Payment, PaymentSchedule } from "@/types/entities";
import { addDays, format, startOfMonth } from "date-fns";

export async function getDashboardKPIs(agentId?: string | null): Promise<DashboardKPIs> {
  await requireSession();
  const supabase = createClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const weekEnd = format(addDays(new Date(), 7), "yyyy-MM-dd");

  let dealsQuery = supabase
    .from("deals")
    .select("id, total_amount, status, agent_id, client:clients(full_name), property:properties(title)")
    .eq("status", "en_cours");

  if (agentId) {
    dealsQuery = dealsQuery.eq("agent_id", agentId);
  }

  const { data: activeDeals } = await dealsQuery;
  const dealIds = (activeDeals ?? []).map((d) => d.id as string);

  let paymentsQuery = supabase.from("payments").select("amount, paid_at, deal_id");
  if (agentId && dealIds.length > 0) {
    paymentsQuery = paymentsQuery.in("deal_id", dealIds);
  } else if (agentId) {
    return emptyKPIs();
  }

  const { data: allPayments } = await paymentsQuery;
  const payments = (allPayments ?? []) as Payment[];

  const collected_this_month = payments
    .filter((p) => p.paid_at.slice(0, 10) >= monthStart)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  let schedulesQuery = supabase
    .from("payment_schedules")
    .select("*, deal:deals(id, status, agent_id, client:clients(full_name), property:properties(title))")
    .order("due_date");

  if (agentId) {
    schedulesQuery = schedulesQuery.in("deal_id", dealIds.length ? dealIds : ["00000000-0000-0000-0000-000000000000"]);
  }

  const { data: schedulesRaw } = await schedulesQuery;
  const schedules = (schedulesRaw ?? []) as Array<
    PaymentSchedule & {
      deal?: {
        id: string;
        status: string;
        agent_id: string;
        client?: { full_name: string } | null;
        property?: { title: string } | null;
      };
    }
  >;

  const dealPaymentsMap = new Map<string, Payment[]>();
  for (const p of payments) {
    const list = dealPaymentsMap.get(p.deal_id) ?? [];
    list.push(p);
    dealPaymentsMap.set(p.deal_id, list);
  }

  let total_remaining = 0;
  const overdue_schedules: DashboardKPIs["overdue_schedules"] = [];
  const upcoming_payments: DashboardKPIs["upcoming_payments"] = [];

  for (const deal of activeDeals ?? []) {
    const dealPayments = dealPaymentsMap.get(deal.id as string) ?? [];
    total_remaining += Math.max(
      0,
      Number(deal.total_amount) - dealPayments.reduce((s, p) => s + Number(p.amount), 0)
    );
  }

  for (const schedule of schedules) {
    if (schedule.deal?.status !== "en_cours") continue;

    const dealPayments = dealPaymentsMap.get(schedule.deal_id) ?? [];
    const enriched = buildScheduleWithPayments([schedule], dealPayments)[0];
    const remaining = Math.max(0, enriched.amount_due - enriched.paid_amount);

    if (remaining <= 0) continue;

    const entry = {
      schedule_id: schedule.id,
      deal_id: schedule.deal_id,
      client_name: schedule.deal?.client?.full_name ?? "—",
      property_title: schedule.deal?.property?.title ?? "—",
      due_date: schedule.due_date,
      amount_due: enriched.amount_due,
      remaining,
    };

    if (schedule.due_date < today) {
      overdue_schedules.push(entry);
    } else if (schedule.due_date <= weekEnd) {
      upcoming_payments.push(entry);
    }
  }

  return {
    collected_this_month,
    total_remaining,
    overdue_count: overdue_schedules.length,
    overdue_amount: overdue_schedules.reduce((s, o) => s + o.remaining, 0),
    upcoming_payments,
    overdue_schedules,
  };
}

function emptyKPIs(): DashboardKPIs {
  return {
    collected_this_month: 0,
    total_remaining: 0,
    overdue_count: 0,
    overdue_amount: 0,
    upcoming_payments: [],
    overdue_schedules: [],
  };
}
