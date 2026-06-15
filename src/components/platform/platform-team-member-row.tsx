"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  removePlatformTeamMemberAction,
  updatePlatformTeamMemberAction,
} from "@/lib/actions/platform/team";
import { PLATFORM_ROLE_LABELS, type PlatformRole, type PlatformUser } from "@/types/platform";
import { formatDate } from "@/lib/format";

interface PlatformTeamMemberRowProps {
  member: PlatformUser;
  currentUserId: string;
  canManage: boolean;
}

export function PlatformTeamMemberRow({
  member,
  currentUserId,
  canManage,
}: PlatformTeamMemberRowProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(member.full_name);
  const [role, setRole] = useState<PlatformRole>(member.role);
  const [active, setActive] = useState(member.active);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSelf = member.id === currentUserId;

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    const result = await updatePlatformTeamMemberAction(member.id, {
      full_name: fullName,
      role,
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
        `Retirer ${member.full_name} de l'équipe plateforme ? Il perdra l'accès admin SaaS.`
      )
    ) {
      return;
    }
    setLoading(true);
    setError(null);
    const result = await removePlatformTeamMemberAction(member.id);
    if (result.error) setError(result.error);
    else router.refresh();
    setLoading(false);
  };

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{member.full_name}</p>
          <p className="text-sm text-muted-foreground">{member.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{PLATFORM_ROLE_LABELS[member.role]}</Badge>
            {!member.active && <Badge variant="outline">Inactif</Badge>}
            {isSelf && <Badge variant="outline">Vous</Badge>}
            <span className="text-xs text-muted-foreground">
              depuis {formatDate(member.created_at)}
            </span>
          </div>
        </div>

        {canManage && !editing && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} disabled={loading}>
              Modifier
            </Button>
            {!isSelf && (
              <Button variant="destructive" size="sm" onClick={handleRemove} disabled={loading}>
                Retirer
              </Button>
            )}
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {editing && canManage && (
        <div className="mt-4 space-y-3 rounded-lg border bg-muted/30 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`name-${member.id}`}>Nom affiché</Label>
              <Input
                id={`name-${member.id}`}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`role-${member.id}`}>Rôle</Label>
              <select
                id={`role-${member.id}`}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value as PlatformRole)}
                disabled={isSelf}
              >
                <option value="super_admin">Super administrateur</option>
                <option value="support">Support client</option>
                <option value="billing">Facturation</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              disabled={isSelf}
            />
            Compte actif
          </label>
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
