import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDeals } from "@/lib/actions/deals";
import { formatFCFA, formatDate } from "@/lib/format";

const STATUS_LABELS = {
  en_cours: "En cours",
  solde: "Soldé",
  annule: "Annulé",
} as const;

export default async function DealsPage() {
  const deals = await getDeals();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ventes</h1>
          <p className="text-muted-foreground">Paiement échelonné terrain & maison</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/deals/nouveau"><Plus className="h-4 w-4" />Nouvelle vente</Link>
        </Button>
      </div>

      {deals.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Aucune vente.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {deals.map((d) => (
            <Link key={d.id} href={`/dashboard/deals/${d.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{d.property?.title ?? "Bien"}</p>
                    <p className="text-sm text-muted-foreground">
                      {d.client?.full_name} · {formatFCFA(Number(d.total_amount))} · {formatDate(d.created_at)}
                    </p>
                  </div>
                  <Badge variant={d.status === "solde" ? "libre" : d.status === "annule" ? "vendu" : "reserve"}>
                    {STATUS_LABELS[d.status]}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
