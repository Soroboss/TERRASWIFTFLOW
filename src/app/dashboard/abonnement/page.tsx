import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { TrialCountdown } from "@/components/subscription/trial-countdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { formatFcfa, getPlanById, PRICING_PLANS } from "@/lib/pricing";
import { CreditCard, ShieldCheck } from "lucide-react";

export default async function AbonnementPage() {
  const { organization } = await requireSession();
  const plan = getPlanById(organization.plan);
  const isTrial = organization.subscription_status === "trial";
  const isActive = organization.subscription_status === "active";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Abonnement</h1>
        <p className="text-muted-foreground">
          Formule, essai gratuit et renouvellement de votre espace TerraSwiftFlow
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Votre formule — {plan.name}
          </CardTitle>
          <CardDescription>{plan.tagline}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-bold">{formatFcfa(plan.priceMonthly)}</span>
            <span className="text-muted-foreground">FCFA / mois</span>
          </div>

          <ul className="space-y-1 text-sm text-muted-foreground">
            {plan.features.map((feature) => (
              <li key={feature}>• {feature}</li>
            ))}
          </ul>

          <p className="text-sm">
            Statut :{" "}
            <span className="font-medium">
              {isActive
                ? "Actif"
                : isTrial
                  ? "Essai gratuit"
                  : organization.subscription_status === "past_due"
                    ? "Paiement en attente"
                    : "Inactif"}
            </span>
          </p>
        </CardContent>
      </Card>

      {isTrial && organization.trial_ends_at && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle>Période d&apos;essai gratuite</CardTitle>
            <CardDescription>
              Expire le {formatDate(organization.trial_ends_at)}. À la fin de l&apos;essai,
              l&apos;accès sera suspendu jusqu&apos;au paiement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TrialCountdown trialEndsAt={organization.trial_ends_at} />
            <Button asChild variant="outline">
              <Link href="/paywall">Voir les options de paiement</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!isActive && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Activer ou renouveler
            </CardTitle>
            <CardDescription>
              Paiement par Wave, Orange Money, MTN MoMo ou carte bancaire
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/paywall">Accéder à la page de paiement</Link>
            </Button>
          </CardContent>
        </Card>
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
            <p className="mt-2 font-bold">
              {formatFcfa(p.priceMonthly)} FCFA / mois
            </p>
            {p.id === plan.id && (
              <p className="mt-2 text-xs font-medium text-primary">Formule actuelle</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
