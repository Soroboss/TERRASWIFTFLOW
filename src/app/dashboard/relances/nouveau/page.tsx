import { ActivityForm } from "@/components/activities/activity-form";
import { getClients } from "@/lib/actions/clients";
import { requireSession } from "@/lib/auth";
import { parseCompanyProfile } from "@/types/organization-profile";

interface PageProps {
  searchParams: Promise<{ client?: string }>;
}

export default async function NouvelleRelancePage({ searchParams }: PageProps) {
  const session = await requireSession();
  const params = await searchParams;
  const clients = await getClients();
  const companyProfile = parseCompanyProfile(session.organization.company_profile);
  const organizationName = companyProfile.legal_name ?? session.organization.name;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Planifier une relance</h1>
        <p className="text-muted-foreground">
          Appel, visite ou relance — message WhatsApp préparé si besoin
        </p>
      </div>
      <ActivityForm
        clients={clients}
        defaultClientId={params.client ?? ""}
        organizationName={organizationName}
        agentName={session.profile.full_name}
      />
    </div>
  );
}
