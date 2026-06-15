"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClientAction, updateClientAction, type ClientInput } from "@/lib/actions/clients";
import type { Client, Profile } from "@/types/database";
import { CLIENT_SOURCE_LABELS, type ClientSource } from "@/types/entities";

interface ClientFormProps {
  client?: Client;
  agents: Profile[];
  isAgent: boolean;
}

export function ClientForm({ client, agents, isAgent }: ClientFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState(client?.full_name ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [isDiaspora, setIsDiaspora] = useState(client?.is_diaspora ?? false);
  const [country, setCountry] = useState(client?.country ?? "Côte d'Ivoire");
  const [source, setSource] = useState<ClientSource | "">(
    (client?.source as ClientSource) ?? ""
  );
  const [assignedAgentId, setAssignedAgentId] = useState(
    client?.assigned_agent_id ?? agents[0]?.id ?? ""
  );

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    const input: ClientInput = {
      full_name: fullName,
      phone,
      email: email || null,
      is_diaspora: isDiaspora,
      country,
      source: source || null,
      assigned_agent_id: isAgent ? undefined : assignedAgentId,
    };

    const result = client
      ? await updateClientAction(client.id, input)
      : await createClientAction(input);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{client ? "Modifier le client" : "Nouveau client"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-2">
          <Label htmlFor="fullName">Nom complet</Label>
          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone (+225)</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07 07 12 34 56" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail (optionnel)</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Select id="source" value={source} onChange={(e) => setSource(e.target.value as ClientSource | "")}>
              <option value="">— Non renseigné —</option>
              {(Object.entries(CLIENT_SOURCE_LABELS) as [ClientSource, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Pays</Label>
            <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="diaspora"
            type="checkbox"
            checked={isDiaspora}
            onChange={(e) => setIsDiaspora(e.target.checked)}
            className="h-4 w-4 rounded border"
          />
          <Label htmlFor="diaspora">Client diaspora</Label>
        </div>

        {!isAgent && (
          <div className="space-y-2">
            <Label htmlFor="agent">Agent assigné</Label>
            <Select id="agent" value={assignedAgentId} onChange={(e) => setAssignedAgentId(e.target.value)}>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.full_name}</option>
              ))}
            </Select>
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Enregistrement…" : client ? "Mettre à jour" : "Créer le client"}
          </Button>
          <Button variant="outline" onClick={() => router.back()} disabled={loading}>
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
