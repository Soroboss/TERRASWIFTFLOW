"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";
import type { PlatformRole } from "@/types/platform";

const NAV_ITEMS = [
  { href: "/platform", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/platform/tenants", label: "Organisations", icon: Building2 },
  { href: "/platform/abonnements", label: "Abonnements", icon: CreditCard },
  { href: "/platform/equipe", label: "Équipe plateforme", icon: Users },
  { href: "/platform/parametres", label: "Paramètres", icon: Settings },
];

interface PlatformNavProps {
  userName: string;
  role: PlatformRole;
}

export function PlatformNav({ userName, role }: PlatformNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      <div className="mb-8 px-3">
        <p className="flex items-center gap-2 text-lg font-bold text-primary">
          <Shield className="h-5 w-5" />
          Admin SaaS
        </p>
        <p className="text-xs text-muted-foreground">TerraSwiftFlow — propriétaire</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === href || (href !== "/platform" && pathname.startsWith(href))
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
        <p className="truncate px-3 text-xs text-muted-foreground">
          {userName} · {role}
        </p>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={() => logoutAction()}
        >
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
        <span className="ml-2 font-semibold">Admin SaaS</span>
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
