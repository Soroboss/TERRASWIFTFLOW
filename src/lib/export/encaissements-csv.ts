import { requireSession } from "@/lib/auth";
import { canViewAllData } from "@/lib/auth/permissions";
import { getAgentScopeId } from "@/lib/auth/permissions";
import { createClient } from "@/lib/insforge/server";
import { PAYMENT_METHOD_LABELS } from "@/types/entities";
import type { PaymentMethod } from "@/types/database";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

function csvEscape(value: string | number): string {
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function buildEncaissementsCsv(agentId?: string | null): Promise<string> {
  await requireSession();

  const insforge = await createClient();
  let query = insforge.database
    .from("payments")
    .select(
      "paid_at, amount, method, receipt_number, deal:deals(agent_id, client:clients(full_name), property:properties(title, reference))"
    )
    .order("paid_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const header = [
    "Date",
    "Montant FCFA",
    "Mode",
    "N° reçu",
    "Client",
    "Bien",
    "Référence",
  ].join(",");

  const rows: string[] = [header];

  for (const row of data ?? []) {
    const deal = row.deal as
      | {
          agent_id?: string;
          client?: { full_name: string } | null;
          property?: { title: string; reference: string } | null;
        }
      | null
      | undefined;

    if (agentId && deal?.agent_id !== agentId) continue;

    const method = row.method as PaymentMethod;
    const paidAt = format(new Date(row.paid_at as string), "dd/MM/yyyy", { locale: fr });

    rows.push(
      [
        csvEscape(paidAt),
        csvEscape(Number(row.amount)),
        csvEscape(PAYMENT_METHOD_LABELS[method] ?? method),
        csvEscape(row.receipt_number as string),
        csvEscape(deal?.client?.full_name ?? ""),
        csvEscape(deal?.property?.title ?? ""),
        csvEscape(deal?.property?.reference ?? ""),
      ].join(",")
    );
  }

  return rows.join("\n");
}

export async function canExportEncaissements(): Promise<boolean> {
  const session = await requireSession();
  return canViewAllData(session.profile.role) || session.profile.role === "agent";
}

export async function getExportAgentScope(): Promise<string | null> {
  const session = await requireSession();
  return getAgentScopeId(session);
}
