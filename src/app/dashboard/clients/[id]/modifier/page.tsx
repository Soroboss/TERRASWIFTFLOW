import { notFound } from "next/navigation";
import { ClientForm } from "@/components/clients/client-form";
import { requireSession } from "@/lib/auth";
import { getClient, getOrganizationAgents } from "@/lib/actions/clients";

interface PageProps {
  params: { id: string };
}

export default async function ModifierClientPage({ params }: PageProps) {
  const session = await requireSession();
  const [client, agents] = await Promise.all([
    getClient(params.id),
    getOrganizationAgents(),
  ]);
  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Modifier le client</h1>
        <p className="text-muted-foreground">{client.full_name}</p>
      </div>
      <ClientForm client={client} agents={agents} isAgent={session.profile.role === "agent"} />
    </div>
  );
}
