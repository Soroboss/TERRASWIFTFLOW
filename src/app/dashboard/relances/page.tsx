import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityList } from "@/components/activities/activity-list";
import { getTodayActivities } from "@/lib/actions/activities";
import { requireSession } from "@/lib/auth";

export default async function RelancesPage() {
  const session = await requireSession();
  const agentFilter = session.profile.role === "agent" ? session.userId : undefined;
  const activities = await getTodayActivities(agentFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">À faire aujourd&apos;hui</h1>
          <p className="text-muted-foreground">Relances, appels et visites</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/relances/nouveau"><Plus className="h-4 w-4" />Planifier</Link>
        </Button>
      </div>
      <ActivityList activities={activities} />
    </div>
  );
}
