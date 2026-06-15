import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentFilter } from "@/components/dashboard/agent-filter";
import { getDashboardKPIs } from "@/lib/actions/dashboard";
import { getOrganizationAgents } from "@/lib/actions/clients";
import { requireSession } from "@/lib/auth";
import { formatFCFA, formatDate } from "@/lib/format";

interface PageProps {
  searchParams: { agent?: string };
}

export default async function EncaissementsPage({ searchParams }: PageProps) {
  const session = await requireSession();
  const agentId = searchParams.agent ?? null;
  const [kpis, agents] = await Promise.all([
    getDashboardKPIs(agentId),
    session.profile.role === "agent" ? Promise.resolve([]) : getOrganizationAgents(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Encaissements</h1>
          <p className="text-muted-foreground">Suivi des versements échelonnés</p>
        </div>
        {session.profile.role !== "agent" && (
          <AgentFilter agents={agents} currentAgentId={agentId ?? undefined} />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Encaissé ce mois</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-emerald-700">{formatFCFA(kpis.collected_this_month)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Reste à encaisser</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatFCFA(kpis.total_remaining)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Échéances en retard</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{kpis.overdue_count}</p>
            <p className="text-xs text-muted-foreground">{formatFCFA(kpis.overdue_amount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Prochains 7 jours</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{kpis.upcoming_payments.length}</p></CardContent>
        </Card>
      </div>

      {kpis.overdue_schedules.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg text-red-700">Échéances en retard</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {kpis.overdue_schedules.map((s) => (
              <Link key={s.schedule_id} href={`/dashboard/deals/${s.deal_id}`} className="block rounded-md border border-red-200 bg-red-50 p-3 hover:bg-red-100">
                <p className="font-medium">{s.client_name} — {s.property_title}</p>
                <p className="text-sm text-red-800">{formatDate(s.due_date)} · Reste {formatFCFA(s.remaining)}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">Prochains versements (7 jours)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {kpis.upcoming_payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun versement attendu cette semaine.</p>
          ) : (
            kpis.upcoming_payments.map((s) => (
              <Link key={s.schedule_id} href={`/dashboard/deals/${s.deal_id}`} className="block rounded-md border p-3 hover:bg-accent">
                <p className="font-medium">{s.client_name} — {s.property_title}</p>
                <p className="text-sm text-muted-foreground">{formatDate(s.due_date)} · {formatFCFA(s.remaining)}</p>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
