"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  registerAction,
  resendVerificationEmailAction,
  verifyEmailAction,
  completeRegistrationActivationAction,
} from "@/lib/actions/auth";
import { formatFcfa, getPlanById, PRICING_PLANS, type PublicPlanId } from "@/lib/pricing";

type Step = "form" | "verify";

interface RegisterFormProps {
  defaultPlan?: PublicPlanId;
}

export function RegisterForm({ defaultPlan = "starter" }: RegisterFormProps) {
  const [step, setStep] = useState<Step>("form");
  const [selectedPlan, setSelectedPlan] = useState<PublicPlanId>(defaultPlan);
  const [fullName, setFullName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const planDetails = getPlanById(selectedPlan);

  const handleRegister = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);

    const result = await registerAction({
      email,
      password,
      fullName,
      organizationName,
      phone,
      plan: selectedPlan,
    });

    if (result && "error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
  };

  const handleActivateWithoutCode = async () => {
    setError(null);
    setLoading(true);

    const result = await completeRegistrationActivationAction(email, password);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError(null);
    setLoading(true);

    const result = await verifyEmailAction(email, otp.trim());

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);

    const result = await resendVerificationEmailAction(email);

    if (result && "error" in result && result.error) {
      setError(result.error);
    } else {
      setInfo("Un nouveau code a été envoyé.");
    }

    setLoading(false);
  };

  if (step === "verify") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Vérification e-mail</CardTitle>
          <CardDescription>
            Si vous avez reçu un code par e-mail, saisissez-le. Sinon, activez sans code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {info && (
            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">{info}</div>
          )}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="otp">Code à 6 chiffres</Label>
            <Input
              id="otp"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              autoComplete="one-time-code"
            />
          </div>

          <Button className="w-full" onClick={handleVerify} disabled={loading || otp.length < 6}>
            {loading ? "Vérification…" : "Valider et accéder au tableau de bord"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleActivateWithoutCode}
            disabled={loading || !password}
          >
            {loading ? "Activation…" : "Activer sans code e-mail"}
          </Button>

          <div className="flex flex-col gap-2 text-center text-sm">
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="text-primary hover:underline disabled:opacity-50"
            >
              Renvoyer le code
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setOtp("");
                setError(null);
                setInfo(null);
              }}
              className="text-muted-foreground hover:underline"
            >
              ← Modifier mes informations
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Créer votre compte</CardTitle>
        <CardDescription>
          Accès immédiat après inscription — aucun code e-mail requis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-2">
          <Label>Formule d&apos;abonnement</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {PRICING_PLANS.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  selectedPlan === plan.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{plan.name}</span>
                  {selectedPlan === plan.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{plan.tagline}</p>
                <p className="mt-2 text-sm">
                  <span className="font-medium text-emerald-700">
                    {plan.trialDays} j. gratuits
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    puis {formatFcfa(plan.priceMonthly)} FCFA/mois
                  </span>
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          Plan sélectionné : <strong>{planDetails.name}</strong> — essai{" "}
          {planDetails.trialDays} jours, puis {formatFcfa(planDetails.priceMonthly)} FCFA/mois.
        </div>

        <div className="space-y-2">
          <Label htmlFor="org">Nom de l&apos;entreprise</Label>
          <Input
            id="org"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            placeholder="Ex. Foncière Les Palmiers SARL"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName">Votre nom complet</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ex. Kouassi Jean-Baptiste"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone (+225)</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07 07 12 34 56"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Adresse e-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@entreprise.ci"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 caractères"
          />
        </div>

        <Button className="w-full" onClick={handleRegister} disabled={loading}>
          {loading
            ? "Création…"
            : `Démarrer l'essai ${planDetails.name} — ${planDetails.trialDays} jours`}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Déjà inscrit ?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
