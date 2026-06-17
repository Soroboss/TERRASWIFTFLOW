"use server";

import { createClient } from "@/lib/insforge/server";

export interface TenantHeadlineCounts {
  clients: number;
  activeDeals: number;
}

export async function getTenantHeadlineCounts(): Promise<TenantHeadlineCounts> {
  const insforge = await createClient();

  const [clientsResult, dealsResult] = await Promise.all([
    insforge.database.from("clients").select("id", { count: "exact", head: true }),
    insforge.database
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("status", "en_cours"),
  ]);

  if (clientsResult.error) throw new Error(clientsResult.error.message);
  if (dealsResult.error) throw new Error(dealsResult.error.message);

  return {
    clients: clientsResult.count ?? 0,
    activeDeals: dealsResult.count ?? 0,
  };
}
