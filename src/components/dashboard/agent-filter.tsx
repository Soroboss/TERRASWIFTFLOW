"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/types/database";

interface AgentFilterProps {
  agents: Profile[];
  currentAgentId?: string;
  basePath: string;
}

export function AgentFilter({ agents, currentAgentId, basePath }: AgentFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const buildUrl = (agentId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (agentId) {
      params.set("agent", agentId);
    } else {
      params.delete("agent");
    }
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="agentFilter" className="shrink-0">
        Agent
      </Label>
      <Select
        id="agentFilter"
        value={currentAgentId ?? ""}
        onChange={(e) => {
          router.push(buildUrl(e.target.value));
        }}
      >
        <option value="">Tous</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>
            {a.full_name}
          </option>
        ))}
      </Select>
    </div>
  );
}
