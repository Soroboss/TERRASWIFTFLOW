"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cancelDealAction } from "@/lib/actions/deals";
import { formatFCFA } from "@/lib/format";
import type { PaymentMethod } from "@/types/database";
import { PAYMENT_METHOD_LABELS } from "@/types/entities";

interface CancelDealFormProps {
  dealId: string;
  totalPaid: number;
  onClose: () => void;
}

export function CancelDealForm({ dealId, totalPaid, onClose }: CancelDealFormProps) {
  const router = useRouter();
  const requiresRefund = totalPaid > 0;
  const [refundAmount, setRefundAmount] = useState(String(totalPaid));
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>("virement");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    const result = await cancelDealAction({
      deal_id: dealId,
      refund_amount: requiresRefund ? Number(refundAmount.replace(/\s/g, "")) : 0,
      refund_method: requiresRefund ? refundMethod : undefined,
      reason: reason.trim() || undefined,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/dashboard/deals");
    router.refresh();
  };

  return (
    <Card className="border-red-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-red-800">
          <AlertTriangle className="h-5 w-5" />
          Annuler la vente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Le bien redeviendra <strong>libre</strong>. Cette action est réservée au propriétaire (DG)
          et aux managers.
        </p>

        {requiresRefund ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium">Remboursement obligatoire</p>
            <p>
              Des paiements ont été encaissés ({formatFCFA(totalPaid)}). Vous devez enregistrer le
              remboursement intégral du client avant d&apos;annuler.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucun paiement enregistré — annulation sans remboursement.
          </p>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {requiresRefund && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="refund-amount">Montant remboursé (FCFA)</Label>
              <Input
                id="refund-amount"
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refund-method">Mode de remboursement</Label>
              <Select
                id="refund-method"
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value as PaymentMethod)}
              >
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Motif (optionnel)</Label>
          <Input
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex. désistement client, erreur de saisie…"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="destructive" onClick={handleSubmit} disabled={loading}>
            {loading ? "Annulation…" : requiresRefund ? "Rembourser et annuler" : "Confirmer l'annulation"}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Retour
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
