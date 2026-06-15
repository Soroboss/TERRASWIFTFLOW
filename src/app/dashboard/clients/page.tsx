import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getClients } from "@/lib/actions/clients";
import { formatPhoneCI } from "@/lib/format";
import { CLIENT_SOURCE_LABELS, type ClientSource } from "@/types/entities";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground">{clients.length} client{clients.length !== 1 ? "s" : ""}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/clients/nouveau"><Plus className="h-4 w-4" />Nouveau client</Link>
        </Button>
      </div>

      {clients.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Aucun client.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {clients.map((c) => (
            <Link key={c.id} href={`/dashboard/clients/${c.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{c.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPhoneCI(c.phone)}
                      {c.source && ` · ${CLIENT_SOURCE_LABELS[c.source as ClientSource] ?? c.source}`}
                      {c.is_diaspora && " · Diaspora"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
