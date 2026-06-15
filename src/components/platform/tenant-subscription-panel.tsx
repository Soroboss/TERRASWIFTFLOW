"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  activateTenantAction,
  extendTrialAction,
  updateTenantSubscriptionAction,
} from "@/lib/actions/platform/tenants";
import type { Plan, SubscriptionStatus } from "@/types/database";

interface TenantSubscriptionPanelProps {
  tenantId: string;
  plan: Plan;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string | null;
  billingEmail: string | null;
  notes: string | null;
  suspended: boolean;
  canEdit: boolean;
}

export function TenantSubscriptionPanel({
  tenantId,
  plan,
  subscriptionStatus,
  trialEndsAt,
  billingEmail,
  notes,
  suspended,
  canEdit,
}: TenantSubscriptionPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formPlan, setFormPlan] = useState(plan);
  const [formStatus, setFormStatus] = useState(subscriptionStatus);
  const [formBillingEmail, setFormBillingEmail] = useState(billingEmail ?? "");
  const [formNotes, setFormNotes] = useState(notes ?? "");

  const run = async (fn: () => Promise<{ error?: string; success?: boolean }>) => {
    setLoading(true);
    setError(null);
    const result = await fn();
    if (result.error) setError(result.error);
    else router.refresh();
    setLoading(false);
  };

  if (!canEdit) {
    return (
      <p className="text-sm text-muted-foreground">
        Votre rôle ne permet pas de modifier les abonnements.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="plan">Plan</Label>
          <select
            id="plan"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={formPlan}
            onChange={(e) => setFormPlan(e.target.value as Plan)}
          >
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="business">Business</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Statut abonnement</Label>
          <select
            id="status"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={formStatus}
            onChange={(e) => setFormStatus(e.target.value as SubscriptionStatus)}
          >
            <option value="trial">Essai</option>
            <option value="active">Actif</option>
            <option value="past_due">Impayé</option>
            <option value="cancelled">Résilié</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="billing">E-mail facturation</Label>
        <Input
          id="billing"
          type="email"
          value={formBillingEmail}
          onChange={(e) => setFormBillingEmail(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes internes</Label>
        <textarea
          id="notes"
          className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formNotes}
          onChange={(e) => setFormNotes(e.target.value)}
        />
      </div>

      {trialEndsAt && (
        <p className="text-sm text-muted-foreground">Fin d&apos;essai : {trialEndsAt}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          disabled={loading}
          onClick={() =>
            run(() =>
              updateTenantSubscriptionAction(tenantId, {
                plan: formPlan,
                subscription_status: formStatus,
                billing_email: formBillingEmail || null,
                notes: formNotes || null,
                suspended,
              })
            )
          }
        >
          Enregistrer
        </Button>
        <Button
          variant="secondary"
          disabled={loading}
          onClick={() => run(() => activateTenantAction(tenantId))}
        >
          Activer l&apos;abonnement
        </Button>
        <Button
          variant="outline"
          disabled={loading}
          onClick={() => run(() => extendTrialAction(tenantId, 14))}
        >
          +14 jours d&apos;essai
        </Button>
        <Button
          variant="outline"
          disabled={loading}
          onClick={() =>
            run(() =>
              updateTenantSubscriptionAction(tenantId, {
                suspended: !suspended,
              })
            )
          }
        >
          {suspended ? "Réactiver le tenant" : "Suspendre le tenant"}
        </Button>
      </div>
    </div>
  );
}
