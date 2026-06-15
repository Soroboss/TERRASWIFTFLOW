"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  Handshake,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  UserCog,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/encaissements", label: "Encaissements", icon: Wallet },
  { href: "/dashboard/biens", label: "Biens", icon: Building2 },
  { href: "/dashboard/plans", label: "Plans de masse", icon: Map },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/deals", label: "Ventes", icon: Handshake },
  { href: "/dashboard/relances", label: "Relances", icon: Bell },
  { href: "/dashboard/abonnement", label: "Abonnement", icon: CreditCard },
];

interface DashboardNavProps {
  organizationName: string;
  userName: string;
  canManageTeam?: boolean;
}

const TEAM_NAV_ITEM = { href: "/dashboard/equipe", label: "Équipe", icon: UserCog };

export function DashboardNav({ organizationName, userName, canManageTeam }: DashboardNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logoutAction();
  };

  const navContent = (
    <>
      <div className="mb-8 px-3">
        <p className="text-lg font-bold text-primary">TerraSwiftFlow</p>
        <p className="truncate text-xs text-muted-foreground">{organizationName}</p>
        <p className="mt-1 text-[10px] text-muted-foreground">Vente cash ou échelonnée</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {[...NAV_ITEMS, ...(canManageTeam ? [TEAM_NAV_ITEM] : [])].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto border-t pt-4">
        <p className="mb-2 truncate px-3 text-xs text-muted-foreground">{userName}</p>
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </>
  );

  return (
    <>
      <div className="fixed left-0 top-0 z-40 flex h-14 w-full items-center border-b bg-background px-4 lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <span className="ml-2 font-semibold">TerraSwiftFlow</span>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-background p-4 shadow-xl">
            <Button variant="ghost" size="icon" className="mb-4 self-end" onClick={() => setMobileOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
            {navContent}
          </aside>
        </div>
      )}

      <aside className="hidden w-64 shrink-0 flex-col border-r bg-background p-4 lg:flex">
        {navContent}
      </aside>
    </>
  );
}
