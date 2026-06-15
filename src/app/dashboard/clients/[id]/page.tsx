import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClient } from "@/lib/actions/clients";
import { formatDate, formatPhoneCI } from "@/lib/format";
import { CLIENT_SOURCE_LABELS, type ClientSource } from "@/types/entities";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{client.full_name}</h1>
          <p className="text-muted-foreground">{formatPhoneCI(client.phone)}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/clients/${id}/modifier`}>
            <Pencil className="h-4 w-4" />Modifier
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Informations</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {client.email && <p>E-mail : {client.email}</p>}
          <p>Pays : {client.country}</p>
          {client.source && (
            <p>Source : {CLIENT_SOURCE_LABELS[client.source as ClientSource] ?? client.source}</p>
          )}
          <p>Diaspora : {client.is_diaspora ? "Oui" : "Non"}</p>
          <p>Créé le : {formatDate(client.created_at)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
