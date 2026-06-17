"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WhatsAppRelancePanel } from "@/components/activities/whatsapp-relance-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createActivityAction } from "@/lib/actions/activities";
import type { Client } from "@/types/database";
import { ACTIVITY_TYPE_LABELS, type ActivityType } from "@/types/entities";

interface ActivityFormProps {
  clients: Client[];
  defaultClientId?: string;
  organizationName?: string;
  agentName?: string;
}

export function ActivityForm({
  clients,
  defaultClientId = "",
  organizationName = "Notre agence",
  agentName = "Votre conseiller",
}: ActivityFormProps) {
  const router = useRouter();
  const [clientId, setClientId] = useState(defaultClientId);
  const [type, setType] = useState<ActivityType>("relance");
  const [note, setNote] = useState("");
  const [dueAt, setDueAt] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedClient = clients.find((c) => c.id === clientId);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    const result = await createActivityAction({
      client_id: clientId,
      type,
      note: note || undefined,
      due_at: `${dueAt}T09:00:00.000Z`,
    });
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Nouvelle relance</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="space-y-2">
          <Label htmlFor="client">Client</Label>
          <Select id="client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">— Sélectionner —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select id="type" value={type} onChange={(e) => setType(e.target.value as ActivityType)}>
              {(Object.entries(ACTIVITY_TYPE_LABELS) as [ActivityType, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="due">Échéance</Label>
            <Input id="due" type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">Note</Label>
          <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {selectedClient?.phone && (
          <WhatsAppRelancePanel
            variant="full"
            phone={selectedClient.phone}
            clientName={selectedClient.full_name}
            organizationName={organizationName}
            agentName={agentName}
            dueDate={dueAt}
          />
        )}

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={loading || !clientId}>
            {loading ? "Création…" : "Planifier"}
          </Button>
          <Button variant="outline" onClick={() => router.back()} disabled={loading}>Annuler</Button>
        </div>
      </CardContent>
    </Card>
  );
}
