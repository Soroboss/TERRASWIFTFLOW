"use server";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/insforge/server";
import { getMaxAgentsForPlan } from "@/lib/pricing";

export interface TenantHeadlineCounts {
  clients: number;
  activeDeals: number;
}

export interface PlanUsage {
  properties: number;
  agents: number;
  activeDeals: number;
  masterplans: number;
  maxAgents: number | null;
}

export async function getTenantHeadlineCounts(
  agentId?: string | null
): Promise<TenantHeadlineCounts> {
  const insforge = await createClient();

  let clientsQuery = insforge.database.from("clients").select("id", { count: "exact", head: true });
  let dealsQuery = insforge.database
    .from("deals")
    .select("id", { count: "exact", head: true })
    .eq("status", "en_cours");

  if (agentId) {
    clientsQuery = clientsQuery.eq("assigned_agent_id", agentId);
    dealsQuery = dealsQuery.eq("agent_id", agentId);
  }

  const [clientsResult, dealsResult] = await Promise.all([clientsQuery, dealsQuery]);

  if (clientsResult.error) throw new Error(clientsResult.error.message);
  if (dealsResult.error) throw new Error(dealsResult.error.message);

  return {
    clients: clientsResult.count ?? 0,
    activeDeals: dealsResult.count ?? 0,
  };
}

export async function getPlanUsage(): Promise<PlanUsage> {
  const { organization } = await requireSession();
  const insforge = await createClient();

  const [properties, agents, activeDeals, masterplans] = await Promise.all([
    insforge.database.from("properties").select("id", { count: "exact", head: true }),
    insforge.database
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("active", true),
    insforge.database
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("status", "en_cours"),
    insforge.database.from("masterplans").select("id", { count: "exact", head: true }),
  ]);

  if (properties.error) throw new Error(properties.error.message);
  if (agents.error) throw new Error(agents.error.message);
  if (activeDeals.error) throw new Error(activeDeals.error.message);
  if (masterplans.error) throw new Error(masterplans.error.message);

  return {
    properties: properties.count ?? 0,
    agents: agents.count ?? 0,
    activeDeals: activeDeals.count ?? 0,
    masterplans: masterplans.count ?? 0,
    maxAgents: getMaxAgentsForPlan(organization.plan),
  };
}
