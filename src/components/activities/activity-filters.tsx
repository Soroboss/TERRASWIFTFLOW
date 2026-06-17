"use client";

import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { ActivityType } from "@/types/entities";

interface ActivityFiltersProps {
  view?: string;
  type?: string;
  agent?: string;
  agents?: Array<{ id: string; full_name: string }>;
}

const VIEW_OPTIONS = [
  { value: "pending", label: "À traiter" },
  { value: "overdue", label: "En retard" },
  { value: "today", label: "Aujourd'hui" },
  { value: "upcoming", label: "À venir" },
  { value: "done", label: "Terminées" },
] as const;

export function ActivityFilters({
  view = "pending",
  type = "",
  agent = "",
  agents = [],
}: ActivityFiltersProps) {
  const router = useRouter();

  const pushFilters = (next: ActivityFiltersProps) => {
    const params = new URLSearchParams();
    if (next.view && next.view !== "pending") params.set("view", next.view);
    if (next.type) params.set("type", next.type);
    if (next.agent) params.set("agent", next.agent);
    const query = params.toString();
    router.push(query ? `/dashboard/relances?${query}` : "/dashboard/relances");
  };

  return (
    <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor="activity-view">Période</Label>
        <Select
          id="activity-view"
          value={view}
          onChange={(e) => pushFilters({ view: e.target.value, type, agent })}
        >
          {VIEW_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="activity-type">Type</Label>
        <Select
          id="activity-type"
          value={type}
          onChange={(e) =>
            pushFilters({ view, type: e.target.value as ActivityType | "", agent })
          }
        >
          <option value="">Tous</option>
          <option value="appel">Appel</option>
          <option value="visite">Visite</option>
          <option value="relance">Relance</option>
        </Select>
      </div>
      {agents.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="activity-agent">Agent</Label>
          <Select
            id="activity-agent"
            value={agent}
            onChange={(e) => pushFilters({ view, type, agent: e.target.value })}
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
