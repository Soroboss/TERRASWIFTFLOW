"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addPlatformTeamMemberAction } from "@/lib/actions/platform/team";
import type { PlatformRole } from "@/types/platform";

export function AddTeamMemberForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<PlatformRole>("support");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    const result = await addPlatformTeamMemberAction(email, role, fullName);
    if (result.error) setError(result.error);
    else {
      setEmail("");
      setFullName("");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="team-email">E-mail du compte</Label>
          <Input
            id="team-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@terraswiftflow.ci"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="team-name">Nom affiché</Label>
          <Input
            id="team-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Kouassi Admin"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="team-role">Rôle plateforme</Label>
        <select
          id="team-role"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value as PlatformRole)}
        >
          <option value="super_admin">Super administrateur</option>
          <option value="support">Support client</option>
          <option value="billing">Facturation</option>
        </select>
      </div>
      <Button onClick={handleSubmit} disabled={loading || !email}>
        {loading ? "Ajout…" : "Ajouter à l'équipe"}
      </Button>
      <p className="text-xs text-muted-foreground">
        La personne doit posséder un compte TerraSwiftFlow (auth InsForge) avant d&apos;être
        ajoutée.
      </p>
    </div>
  );
}
