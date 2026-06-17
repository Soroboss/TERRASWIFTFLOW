import Link from "next/link";
import { Building2, Handshake, Map, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

const ACTIONS = [
  { href: "/dashboard/biens/nouveau", label: "Nouveau bien", icon: Building2 },
  { href: "/dashboard/deals/nouveau", label: "Nouvelle vente", icon: Handshake },
  { href: "/dashboard/encaissements", label: "Encaissements", icon: Wallet },
  { href: "/dashboard/plans/nouveau", label: "Nouveau plan", icon: Map },
] as const;

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map(({ href, label, icon: Icon }) => (
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
