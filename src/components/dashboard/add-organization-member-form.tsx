"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addOrganizationTeamMemberAction } from "@/lib/actions/team";
import type { UserRole } from "@/types/database";

export function AddOrganizationMemberForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("agent");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const result = await addOrganizationTeamMemberAction(
      email,
      role,
      fullName,
      password,
      phone
    );
    if (result.error) setError(result.error);
    else {
      setSuccess(result.message ?? "Collaborateur ajouté.");
      setEmail("");
      setFullName("");
      setPhone("");
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
          <Label htmlFor="member-email">E-mail</Label>
          <Input
            id="member-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="agent@votre-entreprise.ci"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="member-name">Nom complet</Label>
          <Input
            id="member-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Aya Koné"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="member-phone">Téléphone (optionnel)</Label>
          <Input
            id="member-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+225 07 00 00 00 00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="member-password">Mot de passe</Label>
          <Input
            id="member-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 caractères"
            autoComplete="new-password"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="member-role">Rôle dans l&apos;organisation</Label>
        <select
          id="member-role"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
        >
          <option value="agent">Agent commercial</option>
          <option value="manager">Manager</option>
        </select>
      </div>
      <Button onClick={handleSubmit} disabled={loading || !email || !fullName}>
        {loading ? "Création…" : "Créer le collaborateur"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Le collaborateur se connecte sur /login avec cet e-mail. Compte activé
        immédiatement — pas de code e-mail à saisir.
      </p>
    </div>
  );
}
