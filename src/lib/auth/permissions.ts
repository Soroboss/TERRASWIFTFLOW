import type { UserRole } from "@/types/database";
import type { SessionContext } from "@/lib/auth";

export type TenantPermission =
  | "view_all_data"
  | "manage_catalog"
  | "delete_catalog"
  | "manage_clients"
  | "delete_clients"
  | "manage_deals"
  | "cancel_deals"
  | "manage_team"
  | "manage_team_roles"
  | "manage_organization_settings"
  | "manage_subscription";

const OWNER_PERMISSIONS: TenantPermission[] = [
  "view_all_data",
  "manage_catalog",
  "delete_catalog",
  "manage_clients",
  "delete_clients",
  "manage_deals",
  "cancel_deals",
  "manage_team",
  "manage_team_roles",
  "manage_organization_settings",
  "manage_subscription",
];

const MANAGER_PERMISSIONS: TenantPermission[] = [
  "view_all_data",
  "manage_catalog",
  "delete_catalog",
  "manage_clients",
  "delete_clients",
  "manage_deals",
  "cancel_deals",
  "manage_team",
];

const AGENT_PERMISSIONS: TenantPermission[] = [
  "manage_clients",
  "manage_deals",
];

const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<TenantPermission>> = {
  owner: new Set(OWNER_PERMISSIONS),
  manager: new Set(MANAGER_PERMISSIONS),
  agent: new Set(AGENT_PERMISSIONS),
};

export function hasPermission(role: UserRole, permission: TenantPermission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}

export function canViewAllData(role: UserRole): boolean {
  return hasPermission(role, "view_all_data");
}

export function canManageCatalog(role: UserRole): boolean {
  return hasPermission(role, "manage_catalog");
}

export function canDeleteCatalog(role: UserRole): boolean {
  return hasPermission(role, "delete_catalog");
}

export function canManageClients(role: UserRole): boolean {
  return hasPermission(role, "manage_clients");
}

export function canDeleteClients(role: UserRole): boolean {
  return hasPermission(role, "delete_clients");
}

export function canManageDeals(role: UserRole): boolean {
  return hasPermission(role, "manage_deals");
}

export function canCancelDeals(role: UserRole): boolean {
  return hasPermission(role, "cancel_deals");
}

export function canManageTeam(role: UserRole): boolean {
  return hasPermission(role, "manage_team");
}

export function canManageTeamRoles(role: UserRole): boolean {
  return hasPermission(role, "manage_team_roles");
}

export function canManageOrganizationSettings(role: UserRole): boolean {
  return hasPermission(role, "manage_organization_settings");
}

export function canManageSubscription(role: UserRole): boolean {
  return hasPermission(role, "manage_subscription");
}

/** Filtre agent : null = vue organisation entière (owner/manager). */
export function getAgentScopeId(session: SessionContext): string | null {
  return canViewAllData(session.profile.role) ? null : session.userId;
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case "owner":
      return "Propriétaire";
    case "manager":
      return "Manager";
    case "agent":
      return "Agent commercial";
  }
}
