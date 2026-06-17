"use server";

import { buildScheduleWithPayments } from "@/lib/deals";
import { buildLotHrefMap } from "@/lib/dashboard/overview";
import { getActiveDealsByPropertyIds } from "@/lib/actions/deals";
import { getTodayActivities } from "@/lib/actions/activities";
import {
  getMasterplansWithLots,
  getOverviewLotProperties,
  getPropertyStatusCounts,
  type MasterplanLotSummary,
  type MasterplanWithLots,
} from "@/lib/actions/masterplans";
import { createClient } from "@/lib/insforge/server";
import type { DashboardKPIs, Payment } from "@/types/entities";
import { addDays, format, startOfMonth } from "date-fns";

export async function getDashboardKPIs(agentId?: string | null): Promise<DashboardKPIs> {
  const insforge = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const weekEnd = format(addDays(new Date(), 7), "yyyy-MM-dd");

  let dealsQuery = insforge.database
    .from("deals")
    .select("id, total_amount, status, agent_id")
    .eq("status", "en_cours");

  if (agentId) {
    dealsQuery = dealsQuery.eq("agent_id", agentId);
  }

  const { data: activeDeals, error: dealsError } = await dealsQuery;
  if (dealsError) throw new Error(dealsError.message);

  const dealIds = (activeDeals ?? []).map((d) => d.id as string);

  if (agentId && dealIds.length === 0) {
    return emptyKPIs();
  }

  let monthPaymentsQuery = insforge.database
    .from("payments")
    .select("amount")
    .gte("paid_at", monthStart);

  if (agentId && dealIds.length > 0) {
    monthPaymentsQuery = monthPaymentsQuery.in("deal_id", dealIds);
  }

  const dealPaymentsQuery =
    dealIds.length > 0
      ? insforge.database.from("payments").select("amount, deal_id").in("deal_id", dealIds)
      : Promise.resolve({ data: [], error: null });

  const schedulesQuery =
    dealIds.length > 0
      ? insforge.database
          .from("payment_schedules")
          .select(
            "id, deal_id, due_date, amount_due, deal:deals(id, status, agent_id, client:clients(full_name), property:properties(title))"
          )
          .in("deal_id", dealIds)
          .lte("due_date", weekEnd)
      : Promise.resolve({ data: [], error: null });

  const overdueSchedulesQuery =
    dealIds.length > 0
      ? insforge.database
          .from("payment_schedules")
          .select(
            "id, deal_id, due_date, amount_due, deal:deals(id, status, agent_id, client:clients(full_name), property:properties(title))"
          )
          .in("deal_id", dealIds)
          .lt("due_date", today)
      : Promise.resolve({ data: [], error: null });

  const [
    { data: monthPayments },
    { data: dealPaymentsRaw },
    { data: upcomingSchedulesRaw },
    { data: overdueSchedulesRaw },
  ] = await Promise.all([
    monthPaymentsQuery,
    dealPaymentsQuery,
    schedulesQuery,
    overdueSchedulesQuery,
  ]);

  const collected_this_month = (monthPayments ?? []).reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );

  const payments = (dealPaymentsRaw ?? []) as Payment[];
  const dealPaymentsMap = new Map<string, Payment[]>();
  for (const payment of payments) {
    const list = dealPaymentsMap.get(payment.deal_id) ?? [];
    list.push(payment);
    dealPaymentsMap.set(payment.deal_id, list);
  }

  let total_remaining = 0;
  for (const deal of activeDeals ?? []) {
    const dealPayments = dealPaymentsMap.get(deal.id as string) ?? [];
    total_remaining += Math.max(
      0,
      Number(deal.total_amount) - dealPayments.reduce((s, p) => s + Number(p.amount), 0)
    );
  }

  type ScheduleRow = {
    id: string;
    deal_id: string;
    due_date: string;
    amount_due: number;
    deal?: {
      id: string;
      status: string;
      agent_id: string;
      client?: { full_name: string } | null;
      property?: { title: string } | null;
    };
  };

  const overdueRows = (overdueSchedulesRaw ?? []) as unknown as ScheduleRow[];
  const upcomingRows = (upcomingSchedulesRaw ?? []) as unknown as ScheduleRow[];

  const enrichSchedule = (schedule: ScheduleRow) => {
    if (schedule.deal?.status !== "en_cours") return null;

    const dealPayments = dealPaymentsMap.get(schedule.deal_id) ?? [];
    const enriched = buildScheduleWithPayments(
      [
        {
          id: schedule.id,
          deal_id: schedule.deal_id,
          due_date: schedule.due_date,
          amount_due: schedule.amount_due,
          organization_id: "",
          label: "",
        },
      ],
      dealPayments
    )[0];
    const remaining = Math.max(0, enriched.amount_due - enriched.paid_amount);
    if (remaining <= 0) return null;

    return {
      schedule_id: schedule.id,
      deal_id: schedule.deal_id,
      client_name: schedule.deal?.client?.full_name ?? "—",
      property_title: schedule.deal?.property?.title ?? "—",
      due_date: schedule.due_date,
      amount_due: enriched.amount_due,
      remaining,
    };
  };

  const overdue_schedules: DashboardKPIs["overdue_schedules"] = [];
  const upcoming_payments: DashboardKPIs["upcoming_payments"] = [];
  const seenOverdue = new Set<string>();

  for (const schedule of overdueRows) {
    const entry = enrichSchedule(schedule);
    if (!entry) continue;
    overdue_schedules.push(entry);
    seenOverdue.add(schedule.id);
  }

  for (const schedule of upcomingRows) {
    if (seenOverdue.has(schedule.id)) continue;
    if (schedule.due_date < today) continue;
    const entry = enrichSchedule(schedule);
    if (entry) upcoming_payments.push(entry);
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

export interface DashboardPageData {
  kpis: DashboardKPIs;
  activities: Awaited<ReturnType<typeof getTodayActivities>>;
  propertyCounts: Awaited<ReturnType<typeof getPropertyStatusCounts>>;
  primaryMasterplan: MasterplanWithLots | null;
  overviewLots: MasterplanLotSummary[];
  lotHrefById: Map<string, string>;
}

export async function getDashboardPageData(
  agentId?: string | null
): Promise<DashboardPageData> {
  const [kpis, activities, masterplansWithLots, propertyCounts] = await Promise.all([
    getDashboardKPIs(agentId),
    getTodayActivities(agentId ?? undefined),
    getMasterplansWithLots(),
    getPropertyStatusCounts(),
  ]);

  const primaryMasterplan = masterplansWithLots[0] ?? null;
  const overviewLots =
    primaryMasterplan && primaryMasterplan.lots.length > 0
      ? primaryMasterplan.lots
      : await getOverviewLotProperties();

  const dealsByProperty = await getActiveDealsByPropertyIds(
    overviewLots.map((lot) => lot.id)
  );
  const lotHrefById = buildLotHrefMap(
    overviewLots.map((lot) => lot.id),
    dealsByProperty
  );

  return {
    kpis,
    activities,
    propertyCounts,
    primaryMasterplan,
    overviewLots,
    lotHrefById,
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
