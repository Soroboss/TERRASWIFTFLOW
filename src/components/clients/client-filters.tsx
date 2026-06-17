"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { ClientSource } from "@/types/entities";

interface ClientFiltersProps {
  q?: string;
  source?: string;
  diaspora?: string;
  agent?: string;
  agents?: Array<{ id: string; full_name: string }>;
}

export function ClientFilters({
  q = "",
  source = "",
  diaspora = "",
  agent = "",
  agents = [],
}: ClientFiltersProps) {
  const router = useRouter();

  const pushFilters = (next: ClientFiltersProps) => {
    const params = new URLSearchParams();
    if (next.q?.trim()) params.set("q", next.q.trim());
    if (next.source) params.set("source", next.source);
    if (next.diaspora) params.set("diaspora", next.diaspora);
    if (next.agent) params.set("agent", next.agent);
    const query = params.toString();
    router.push(query ? `/dashboard/clients?${query}` : "/dashboard/clients");
  };

  return (
    <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-2 sm:col-span-2 lg:col-span-1">
        <Label htmlFor="client-q">Rechercher</Label>
        <Input
          id="client-q"
          defaultValue={q}
          placeholder="Nom ou téléphone…"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              pushFilters({ q: e.currentTarget.value, source, diaspora, agent });
            }
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="client-source">Source</Label>
        <Select
          id="client-source"
          value={source}
          onChange={(e) =>
            pushFilters({ q, source: e.target.value as ClientSource | "", diaspora, agent })
          }
        >
          <option value="">Toutes</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="terrain">Sur le terrain</option>
          <option value="facebook">Facebook</option>
          <option value="salon">Salon / Événement</option>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="client-diaspora">Diaspora</Label>
        <Select
          id="client-diaspora"
          value={diaspora}
          onChange={(e) => pushFilters({ q, source, diaspora: e.target.value, agent })}
        >
          <option value="">Tous</option>
          <option value="oui">Oui</option>
          <option value="non">Non</option>
        </Select>
      </div>
      {agents.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="client-agent">Agent</Label>
          <Select
            id="client-agent"
            value={agent}
            onChange={(e) => pushFilters({ q, source, diaspora, agent: e.target.value })}
          >
            <option value="">Tous</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name}
              </option>
            ))}
          </Select>
        </div>
      )}
    </div>
  );
}
