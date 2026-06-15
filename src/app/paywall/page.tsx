import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageBackNav } from "@/components/layout/page-back-nav";
import { SubscriptionPaymentForm } from "@/components/payment/subscription-payment-form";
import { getSessionContext, isSubscriptionActive } from "@/lib/auth";
import { formatFcfa, getPlanById, PRICING_PLANS } from "@/lib/pricing";
import { TrialCountdown } from "@/components/subscription/trial-countdown";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function PaywallPage() {
  const session = await getSessionContext();

  if (!session) {
    redirect("/login");
  }

  const { organization } = session;
  const plan = getPlanById(organization.plan);
  const amountLabel = `${formatFcfa(plan.priceMonthly)} FCFA / mois`;
  const trialActive =
    organization.subscription_status === "trial" &&
    organization.trial_ends_at &&
    new Date(organization.trial_ends_at) > new Date();
  const trialExpired = !isSubscriptionActive(organization);

  if (organization.subscription_status === "active") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="mx-auto max-w-3xl space-y-6">
        {!trialExpired && (
          <PageBackNav homeHref="/dashboard/abonnement" homeLabel="Abonnement" />
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              {trialActive ? "Essai gratuit en cours" : "Activez votre abonnement"}
            </CardTitle>
            <CardDescription>
              {trialActive
                ? "Votre accès sera suspendu à la fin de l'essai. Anticipez le paiement pour éviter toute interruption."
                : "Votre essai est terminé. Payez pour retrouver l'accès à TerraSwiftFlow."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {trialActive && organization.trial_ends_at && (
              <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                <p className="text-sm font-medium text-amber-900">Temps restant avant blocage</p>
                <TrialCountdown trialEndsAt={organization.trial_ends_at} />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {PRICING_PLANS.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-lg border p-4 ${
                    p.id === plan.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-background"
                  }`}
                >
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{p.tagline}</p>
                  <p className="mt-2 text-lg font-bold">
                    {formatFcfa(p.priceMonthly)}{" "}
                    <span className="text-sm font-normal text-muted-foreground">FCFA / mois</span>
                  </p>
                  {p.id === plan.id && (
                    <p className="mt-2 text-xs font-medium text-primary">Votre formule</p>
                  )}
                </div>
              ))}
            </div>

            <SubscriptionPaymentForm planName={plan.name} amountLabel={amountLabel} />

            <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Besoin d&apos;aide ?{" "}
                <a
                  href="mailto:contact@terraswiftflow.ci"
                  className="text-primary hover:underline"
                >
                  contact@terraswiftflow.ci
                </a>
              </p>
              {trialActive && (
                <Button asChild variant="outline">
                  <Link href="/dashboard">Retour au tableau de bord</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
