"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  removeOrganizationTeamMemberAction,
  updateOrganizationTeamMemberAction,
} from "@/lib/actions/team";
import type { Profile, UserRole } from "@/types/database";
import { formatDate } from "@/lib/format";

const ROLE_LABELS = {
  owner: "Propriétaire",
  manager: "Manager",
  agent: "Agent",
} as const;

interface OrganizationTeamMemberRowProps {
  member: Profile;
  currentUserId: string;
}

export function OrganizationTeamMemberRow({
  member,
  currentUserId,
}: OrganizationTeamMemberRowProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(member.full_name);
  const [phone, setPhone] = useState(member.phone ?? "");
  const [role, setRole] = useState<UserRole>(member.role);
  const [active, setActive] = useState(member.active);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSelf = member.id === currentUserId;
  const isOwner = member.role === "owner";

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    const result = await updateOrganizationTeamMemberAction(member.id, {
      full_name: fullName,
      phone: phone || null,
      role: isOwner ? undefined : role,
      active,
    });
    if (result.error) {
      setError(result.error);
    } else {
      setEditing(false);
      router.refresh();
    }
    setLoading(false);
  };

  const handleRemove = async () => {
    if (
      !window.confirm(
        `Retirer ${member.full_name} de votre organisation ? Il perdra l'accès au tableau de bord.`
      )
    ) {
      return;
    }
    setLoading(true);
    setError(null);
    const result = await removeOrganizationTeamMemberAction(member.id);
    if (result.error) setError(result.error);
    else router.refresh();
    setLoading(false);
  };

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{member.full_name}</p>
          <p className="text-sm text-muted-foreground">
            {member.phone ?? "Téléphone non renseigné"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{ROLE_LABELS[member.role]}</Badge>
            {!member.active && <Badge variant="outline">Inactif</Badge>}
            {isSelf && <Badge variant="outline">Vous</Badge>}
            <span className="text-xs text-muted-foreground">
              depuis {formatDate(member.created_at)}
            </span>
          </div>
        </div>

        {!editing && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} disabled={loading}>
              Modifier
            </Button>
            {!isSelf && !isOwner && (
              <Button variant="destructive" size="sm" onClick={handleRemove} disabled={loading}>
                Retirer
              </Button>
            )}
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {editing && (
        <div className="mt-4 space-y-3 rounded-lg border bg-muted/30 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`org-name-${member.id}`}>Nom complet</Label>
              <Input
                id={`org-name-${member.id}`}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`org-phone-${member.id}`}>Téléphone</Label>
              <Input
                id={`org-phone-${member.id}`}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+225 07 00 00 00 00"
              />
            </div>
          </div>
          {!isOwner && (
            <div className="space-y-2">
              <Label htmlFor={`org-role-${member.id}`}>Rôle</Label>
              <select
                id={`org-role-${member.id}`}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                disabled={isSelf}
              >
                <option value="agent">Agent commercial</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          )}
          {!isOwner && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                disabled={isSelf}
              />
              Compte actif
            </label>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={loading}>
              {loading ? "Enregistrement…" : "Enregistrer"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setFullName(member.full_name);
                setPhone(member.phone ?? "");
                setRole(member.role);
                setActive(member.active);
                setError(null);
              }}
            >
              Annuler
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
