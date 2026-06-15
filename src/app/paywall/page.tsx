import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageBackNav } from "@/components/layout/page-back-nav";
import { formatFcfa, PRICING_PLANS } from "@/lib/pricing";

export default function PaywallPage() {
  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="mx-auto max-w-2xl">
        <PageBackNav homeHref="/dashboard" homeLabel="Tableau de bord" />
      </div>
      <div className="flex items-center justify-center">
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

            <Button asChild>
              <a href="mailto:contact@terraswiftflow.ci?subject=Activation%20abonnement%20TerraSwiftFlow">
                Activer mon abonnement
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
