import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFcfa, PRICING_PLANS } from "@/lib/pricing";
import Link from "next/link";

export default function PaywallPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Votre essai est terminé</CardTitle>
          <CardDescription>
            Activez votre abonnement pour continuer à gérer vos terrains et maisons sans Excel
            ni WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-lg border p-4 ${
                  plan.highlighted ? "border-primary bg-primary/5" : "bg-background"
                }`}
              >
                <p className="font-semibold">{plan.name}</p>
                <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                <p className="mt-2 text-lg font-bold">
                  {formatFcfa(plan.priceMonthly)}{" "}
                  <span className="text-sm font-normal text-muted-foreground">FCFA / mois</span>
                </p>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {plan.features.slice(0, 4).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">
            Contactez-nous pour activer votre abonnement. Paiement Wave, Orange Money, MTN MoMo
            ou virement accepté.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <a href="mailto:contact@terraswiftflow.ci?subject=Activation%20abonnement%20TerraSwiftFlow">
                Activer mon abonnement
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Voir les tarifs</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/login">Retour</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
