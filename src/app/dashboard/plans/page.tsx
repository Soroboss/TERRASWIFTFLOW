import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getMasterplans } from "@/lib/actions/masterplans";

export default async function PlansPage() {
  const masterplans = await getMasterplans();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Plans de masse</h1>
          <p className="text-muted-foreground">
            Visualisez vos lotissements et le statut de chaque lot
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/plans/nouveau">
            <Plus className="h-4 w-4" />
            Nouveau plan
          </Link>
        </Button>
      </div>

      {masterplans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucun plan de masse enregistré.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {masterplans.map((mp) => (
            <Link key={mp.id} href={`/dashboard/plans/${mp.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <p className="font-semibold">{mp.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {mp.total_lots} lot{mp.total_lots !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
