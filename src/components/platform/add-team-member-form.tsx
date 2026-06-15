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
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<PlatformRole>("support");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const result = await addPlatformTeamMemberAction(email, role, fullName, password);
    if (result.error) setError(result.error);
    else {
      setSuccess(result.message ?? "Membre ajouté.");
      setEmail("");
      setFullName("");
      setPassword("");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {success && <p className="rounded-md bg-green-50 p-3 text-sm text-green-800">{success}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="team-email">E-mail du compte staff</Label>
          <Input
            id="team-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="support@terraswiftflow.ci"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="team-name">Nom affiché</Label>
          <Input
            id="team-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Kouassi Support"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="team-password">Mot de passe</Label>
          <Input
            id="team-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 caractères"
            autoComplete="new-password"
          />
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
      </div>
      <Button
        onClick={handleSubmit}
        disabled={loading || !email || !fullName}
      >
        {loading ? "Création…" : "Créer le compte et l'ajouter"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Si l&apos;e-mail n&apos;existe pas encore, un compte staff est créé automatiquement
        (sans organisation cliente). Sinon, le compte existant est simplement ajouté à
        l&apos;équipe — le mot de passe n&apos;est alors pas requis.
      </p>
    </div>
  );
}
