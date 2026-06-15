import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageBackNav } from "@/components/layout/page-back-nav";
import { consumeRegistrationSuccessCookie } from "@/lib/auth/registration-success";
import { formatDate } from "@/lib/format";
import { formatFcfa, getPlanById } from "@/lib/pricing";

export default async function InscriptionReussiePage() {
  const summary = await consumeRegistrationSuccessCookie();

  if (!summary) {
    redirect("/register");
  }

  const plan = getPlanById(summary.plan);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <div className="mx-auto w-full max-w-lg p-4">
        <PageBackNav />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center p-4 pt-0">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl">Inscription confirmée</CardTitle>
            <CardDescription>
              Votre entreprise a été créée. Connectez-vous pour accéder à votre espace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <dl className="space-y-3 rounded-lg border bg-background p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Entreprise</dt>
                <dd className="text-right font-medium">{summary.organizationName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Responsable</dt>
                <dd className="text-right font-medium">{summary.fullName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">E-mail</dt>
                <dd className="text-right font-medium">{summary.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Formule</dt>
                <dd className="text-right font-medium">{plan.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Essai gratuit</dt>
                <dd className="text-right font-medium">
                  {plan.trialDays} jours — jusqu&apos;au {formatDate(summary.trialEndsAt)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t pt-3">
                <dt className="text-muted-foreground">Après l&apos;essai</dt>
                <dd className="text-right font-medium">
                  {formatFcfa(plan.priceMonthly)} FCFA / mois
                </dd>
              </div>
            </dl>

            <p className="text-center text-sm text-muted-foreground">
              Votre compte est prêt. Pour des raisons de sécurité, vous devez vous connecter
              explicitement pour accéder au tableau de bord.
            </p>

            <Button asChild className="w-full" size="lg">
              <Link href={`/login?email=${encodeURIComponent(summary.email)}`}>
                Se connecter maintenant
              </Link>
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              <Link href="/" className="text-primary hover:underline">
                Retour à l&apos;accueil
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
