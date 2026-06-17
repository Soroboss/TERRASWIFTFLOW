import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { TrialCountdown } from "@/components/subscription/trial-countdown";
import { PlanUsageSummary } from "@/components/subscription/plan-usage-summary";
import { PaymentSupportContacts } from "@/components/payment/payment-support-contacts";
import { KpiStatCard } from "@/components/dashboard/kpi-stat-card";
import { getPlanUsage } from "@/lib/actions/tenant-summary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { formatFcfa, getPlanById, PRICING_PLANS } from "@/lib/pricing";
import { CreditCard, ShieldCheck, Timer, Users } from "lucide-react";
import { differenceInDays } from "date-fns";

export default async function AbonnementPage() {
  const { organization } = await requireSession();
  const [plan, usage] = await Promise.all([
    Promise.resolve(getPlanById(organization.plan)),
    getPlanUsage(),
  ]);

  const isTrial = organization.subscription_status === "trial";
  const isActive = organization.subscription_status === "active";
  const trialDaysLeft =
    isTrial && organization.trial_ends_at
      ? Math.max(0, differenceInDays(new Date(organization.trial_ends_at), new Date()))
      : null;

  const statusLabel = isActive
    ? "Actif"
    : isTrial
      ? "Essai gratuit"
      : organization.subscription_status === "past_due"
        ? "Paiement en attente"
        : "Inactif";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Abonnement</h1>
        <p className="text-muted-foreground">
          Formule, essai gratuit et renouvellement de votre espace TerraSwiftFlow
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStatCard title="Formule" value={plan.name} subtitle={plan.tagline} icon={ShieldCheck} />
        <KpiStatCard title="Statut" value={statusLabel} />
        {trialDaysLeft !== null ? (
          <KpiStatCard
            title="Essai restant"
            value={`${trialDaysLeft} j`}
            subtitle={
              organization.trial_ends_at
                ? `Expire le ${formatDate(organization.trial_ends_at)}`
                : undefined
            }
            icon={Timer}
            alert={trialDaysLeft <= 7}
            valueClassName={trialDaysLeft <= 7 ? "text-amber-700" : undefined}
          />
        ) : (
          <KpiStatCard
            title="Tarif mensuel"
            value={`${formatFcfa(plan.priceMonthly)}`}
            subtitle="FCFA / mois"
            icon={CreditCard}
          />
        )}
        <KpiStatCard
          title="Agents actifs"
          value={`${usage.agents}${usage.maxAgents ? ` / ${usage.maxAgents}` : ""}`}
          subtitle={usage.maxAgents ? "Quota plan Starter" : "Illimité (Pro)"}
          icon={Users}
          alert={usage.maxAgents !== null && usage.agents >= usage.maxAgents}
        />
      </div>

      <PlanUsageSummary usage={usage} />

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
            <div className="mt-4">
              <PaymentSupportContacts compact />
            </div>
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
            <p className="mt-2 font-bold">{formatFcfa(p.priceMonthly)} FCFA / mois</p>
            {p.id === plan.id && (
              <p className="mt-2 text-xs font-medium text-primary">Formule actuelle</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
