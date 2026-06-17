import Link from "next/link";
import { Building2, CalendarClock, Handshake, Map, UserPlus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canManageCatalog } from "@/lib/auth/permissions";
import type { UserRole } from "@/types/database";

const ACTIONS = [
  { href: "/dashboard/biens/nouveau", label: "Nouveau bien", icon: Building2, catalogOnly: true },
  { href: "/dashboard/clients/nouveau", label: "Nouveau client", icon: UserPlus },
  { href: "/dashboard/deals/nouveau", label: "Nouvelle vente", icon: Handshake },
  { href: "/dashboard/relances/nouveau", label: "Planifier relance", icon: CalendarClock },
  { href: "/dashboard/encaissements", label: "Encaissements", icon: Wallet },
  { href: "/dashboard/plans/nouveau", label: "Nouveau plan", icon: Map, catalogOnly: true },
] as const;

interface QuickActionsProps {
  role: UserRole;
}

export function QuickActions({ role }: QuickActionsProps) {
  const canManage = canManageCatalog(role);
  const visible = ACTIONS.filter((action) => !("catalogOnly" in action) || canManage);

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map(({ href, label, icon: Icon }) => (
        <Button key={href} asChild variant="outline" size="sm" className="gap-2">
          <Link href={href}>
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        </Button>
      ))}
    </div>
  );
}
