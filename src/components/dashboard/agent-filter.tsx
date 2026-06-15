"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/types/database";

interface AgentFilterProps {
  agents: Profile[];
  currentAgentId?: string;
}

export function AgentFilter({ agents, currentAgentId }: AgentFilterProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="agentFilter" className="shrink-0">Agent</Label>
      <Select
        id="agentFilter"
        value={currentAgentId ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          router.push(val ? `/dashboard/encaissements?agent=${val}` : "/dashboard/encaissements");
        }}
      >
        <option value="">Tous</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>{a.full_name}</option>
        ))}
      </Select>
    </div>
  );
}
