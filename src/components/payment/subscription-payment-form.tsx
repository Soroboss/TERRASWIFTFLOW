"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitSubscriptionPaymentAction } from "@/lib/actions/subscription-payment";
import { cn } from "@/lib/utils";
import { CreditCard, Smartphone } from "lucide-react";

type PaymentMethod = "wave" | "orange_money" | "mtn" | "card";

const METHODS: {
  id: PaymentMethod;
  label: string;
  description: string;
  color: string;
}[] = [
  {
    id: "wave",
    label: "Wave",
    description: "Paiement instantané",
    color: "border-blue-500 bg-blue-50",
  },
  {
    id: "orange_money",
    label: "Orange Money",
    description: "OM Côte d'Ivoire",
    color: "border-orange-500 bg-orange-50",
  },
  {
    id: "mtn",
    label: "MTN MoMo",
    description: "Mobile Money MTN",
    color: "border-yellow-500 bg-yellow-50",
  },
  {
    id: "card",
    label: "Carte bancaire",
    description: "Visa, Mastercard",
    color: "border-slate-500 bg-slate-50",
  },
];

interface SubscriptionPaymentFormProps {
  planName: string;
  amountLabel: string;
}

export function SubscriptionPaymentForm({ planName, amountLabel }: SubscriptionPaymentFormProps) {
  const [method, setMethod] = useState<PaymentMethod>("wave");
  const [phone, setPhone] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    const cardLast4 =
      method === "card" ? cardNumber.replace(/\D/g, "").slice(-4) || undefined : undefined;

    const result = await submitSubscriptionPaymentAction({
      method,
      phone: method !== "card" ? phone : undefined,
      cardLast4,
      transactionRef: transactionRef || undefined,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if ("message" in result && result.message) {
      setSuccess(result.message);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        {success}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Formule {planName}</p>
        <p className="text-2xl font-bold">{amountLabel}</p>
      </div>

      <div className="space-y-2">
        <Label>Mode de paiement</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={cn(
                "rounded-lg border p-4 text-left transition-all",
                method === m.id ? `${m.color} ring-2 ring-primary` : "hover:border-primary/40"
              )}
            >
              <div className="flex items-center gap-2">
                {m.id === "card" ? (
                  <CreditCard className="h-4 w-4" />
                ) : (
                  <Smartphone className="h-4 w-4" />
                )}
                <span className="font-semibold">{m.label}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{m.description}</p>
            </button>
          ))}
        </div>
      </div>

      {method !== "card" ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Numéro {METHODS.find((m) => m.id === method)?.label}</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07 07 12 34 56"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ref">Référence transaction (optionnel)</Label>
            <Input
              id="ref"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="Ex. TXN-123456"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Effectuez le paiement depuis votre application {METHODS.find((m) => m.id === method)?.label},
            puis confirmez ici. Notre équipe activera votre abonnement sous 24 h.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardName">Nom sur la carte</Label>
            <Input
              id="cardName"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="KOUASSI Jean"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Numéro de carte</Label>
            <Input
              id="cardNumber"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/[^\d\s]/g, ""))}
              placeholder="4242 4242 4242 4242"
              maxLength={19}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiration</Label>
              <Input
                id="expiry"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value)}
                placeholder="MM/AA"
                maxLength={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvc">CVC</Label>
              <Input
                id="cvc"
                value={cardCvc}
                onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ""))}
                placeholder="123"
                maxLength={4}
                type="password"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Le paiement par carte sera connecté à un prestataire sécurisé (Stripe). Pour l&apos;instant,
            votre demande est enregistrée pour validation manuelle.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <Button className="w-full" size="lg" onClick={handleSubmit} disabled={loading}>
        {loading ? "Enregistrement…" : `Payer ${amountLabel}`}
      </Button>
    </div>
  );
}
