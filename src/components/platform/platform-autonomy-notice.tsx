import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";

interface PlatformAutonomyNoticeProps {
  variant?: "team" | "tenants" | "general";
}

const MESSAGES = {
  team: "L'équipe plateforme est distincte des utilisateurs des organisations clientes. Vous ne créez ni ne gérez les collaborateurs des entreprises inscrites.",
  tenants:
    "Chaque organisation est autonome. Vous gérez uniquement l'inscription, l'abonnement et la facturation — pas les biens, clients ni utilisateurs internes.",
  general:
    "Espace réservé à TerraSwiftFlow : abonnements, facturation et équipe interne. Les données métier des clients restent dans leur propre espace.",
};

export function PlatformAutonomyNotice({ variant = "general" }: PlatformAutonomyNoticeProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex gap-3 pt-4 text-sm text-muted-foreground">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>{MESSAGES[variant]}</p>
      </CardContent>
    </Card>
  );
}
