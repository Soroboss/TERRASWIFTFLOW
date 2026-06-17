import type { SessionContext } from "@/lib/auth";
import {
  canManageCatalog,
  canManageOrganizationSettings,
  canManageSubscription,
  canManageTeam,
  hasPermission,
  type TenantPermission,
} from "@/lib/auth/permissions";
import type { UserRole } from "@/types/database";
import { redirect } from "next/navigation";

export function requirePermission(
  session: SessionContext,
  permission: TenantPermission,
  redirectTo = "/dashboard"
): void {
  if (!hasPermission(session.profile.role, permission)) {
    redirect(redirectTo);
  }
}

export function requireOwner(session: SessionContext, redirectTo = "/dashboard"): void {
  if (session.profile.role !== "owner") {
    redirect(redirectTo);
  }
}

export function requireManagerOrOwner(session: SessionContext, redirectTo = "/dashboard"): void {
  if (session.profile.role === "agent") {
    redirect(redirectTo);
  }
}

export function requirePageAccess(session: SessionContext, pathname: string): void {
  if (pathname.startsWith("/dashboard/parametres")) {
    if (!canManageOrganizationSettings(session.profile.role)) redirect("/dashboard");
    return;
  }
  if (pathname.startsWith("/dashboard/abonnement")) {
    if (!canManageSubscription(session.profile.role)) redirect("/dashboard");
    return;
  }
  if (pathname.startsWith("/dashboard/equipe")) {
    if (!canManageTeam(session.profile.role)) redirect("/dashboard");
    return;
  }
  if (
    pathname.startsWith("/dashboard/biens/nouveau") ||
    pathname.includes("/modifier") && pathname.startsWith("/dashboard/biens")
  ) {
    if (!canManageCatalog(session.profile.role)) redirect("/dashboard/biens");
    return;
  }
  if (
    pathname.startsWith("/dashboard/plans/nouveau") ||
    (pathname.startsWith("/dashboard/plans/") && !pathname.match(/^\/dashboard\/plans\/?$/))
  ) {
    if (pathname.includes("/nouveau") || pathname.match(/\/plans\/[^/]+$/)) {
      if (!canManageCatalog(session.profile.role) && pathname.includes("/nouveau")) {
        redirect("/dashboard/plans");
      }
    }
  }
}

export function assignableTeamRoles(actorRole: UserRole): UserRole[] {
  if (actorRole === "owner") return ["manager", "agent"];
  if (actorRole === "manager") return ["agent"];
  return [];
}

export function canEditTeamMember(
  actorRole: UserRole,
  memberRole: UserRole,
  isSelf: boolean
): boolean {
  if (isSelf) return true;
  if (memberRole === "owner") return false;
  if (actorRole === "owner") return true;
  if (actorRole === "manager") return memberRole === "agent";
  return false;
}

export function canRemoveTeamMember(actorRole: UserRole, memberRole: UserRole, isSelf: boolean): boolean {
  if (isSelf) return false;
  return canEditTeamMember(actorRole, memberRole, false);
}
