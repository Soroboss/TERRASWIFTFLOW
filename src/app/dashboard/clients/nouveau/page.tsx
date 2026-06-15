import { ClientForm } from "@/components/clients/client-form";
import { requireSession } from "@/lib/auth";
import { getOrganizationAgents } from "@/lib/actions/clients";

export default async function NouveauClientPage() {
  const session = await requireSession();
  const agents = await getOrganizationAgents();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouveau client</h1>
        <p className="text-muted-foreground">Prospect ou acquéreur</p>
      </div>
      <ClientForm agents={agents} isAgent={session.profile.role === "agent"} />
    </div>
  );
}
