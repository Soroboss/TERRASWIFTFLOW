"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

interface DealFiltersProps {
  q?: string;
  status?: string;
  agent?: string;
  agents?: Array<{ id: string; full_name: string }>;
}

export function DealFilters({
  q = "",
  status = "",
  agent = "",
  agents = [],
}: DealFiltersProps) {
  const router = useRouter();

  const pushFilters = (next: DealFiltersProps) => {
    const params = new URLSearchParams();
    if (next.q?.trim()) params.set("q", next.q.trim());
    if (next.status) params.set("status", next.status);
    if (next.agent) params.set("agent", next.agent);
    const query = params.toString();
    router.push(query ? `/dashboard/deals?${query}` : "/dashboard/deals");
  };

  return (
    <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor="deal-q">Rechercher</Label>
        <Input
          id="deal-q"
          defaultValue={q}
          placeholder="Client, bien, référence…"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              pushFilters({ q: e.currentTarget.value, status, agent });
            }
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="deal-status">Statut</Label>
        <Select
          id="deal-status"
          value={status}
          onChange={(e) => pushFilters({ q, status: e.target.value, agent })}
        >
          <option value="">Tous</option>
          <option value="en_cours">En cours</option>
          <option value="solde">Soldé</option>
          <option value="annule">Annulé</option>
        </Select>
      </div>
      {agents.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="deal-agent">Agent</Label>
          <Select
            id="deal-agent"
            value={agent}
            onChange={(e) => pushFilters({ q, status, agent: e.target.value })}
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
