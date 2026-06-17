"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  checkPropertyForDeal,
  createDealAction,
} from "@/lib/actions/deals";
import { formatFCFA } from "@/lib/format";
import {
  CONTRACT_TYPE_LABELS,
  PAYMENT_MODE_LABELS,
} from "@/lib/sales-contract";
import type { Client, ContractType, PaymentMode, Property } from "@/types/database";

interface DealFormProps {
  properties: Property[];
  clients: Client[];
}

export function DealForm({ properties, clients }: DealFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [propertyId, setPropertyId] = useState("");
  const [clientId, setClientId] = useState(searchParams.get("client") ?? "");
  const [totalAmount, setTotalAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("echelonne");
  const [contractType, setContractType] = useState<ContractType>("acd");
  const [depositAmount, setDepositAmount] = useState("");
  const [numMonths, setNumMonths] = useState("12");
  const [firstDueDate, setFirstDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [blockMessage, setBlockMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!propertyId) {
      setBlockMessage(null);
      return;
    }
    checkPropertyForDeal(propertyId).then((check) => {
      if (check.blocked) {
        setBlockMessage(check.reason);
      } else {
        setBlockMessage(null);
        const price = String(check.property.price_total);
        setTotalAmount(price);
        if (paymentMode === "echelonne") {
          setDepositAmount(String(Math.round(Number(price) * 0.3)));
        }
      }
    });
  }, [propertyId, paymentMode]);

  useEffect(() => {
    if (paymentMode === "cash" && totalAmount) {
      setDepositAmount(totalAmount);
      setNumMonths("0");
    }
  }, [paymentMode, totalAmount]);

  const handleSubmit = async () => {
    setError(null);
    if (blockMessage) return;
    setLoading(true);

    const total = Number(totalAmount.replace(/\s/g, ""));
    const result = await createDealAction({
      property_id: propertyId,
      client_id: clientId,
      total_amount: total,
      payment_mode: paymentMode,
      contract_type: contractType,
      deposit_amount:
        paymentMode === "echelonne" ? Number(depositAmount.replace(/\s/g, "")) : total,
      num_months: paymentMode === "echelonne" ? Number(numMonths) : 0,
      first_due_date: firstDueDate,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouvelle vente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {blockMessage && (
          <div className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Anti-double-vente — vente bloquée</p>
              <p>{blockMessage}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-2">
          <Label htmlFor="property">Bien (libre uniquement)</Label>
          <Select id="property" value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
            <option value="">— Sélectionner —</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} — {formatFCFA(Number(p.price_total))}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="client">Client</Label>
          <Select id="client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">— Sélectionner —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name} — {c.phone}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="paymentMode">Mode de paiement</Label>
            <Select
              id="paymentMode"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
            >
              {Object.entries(PAYMENT_MODE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contractType">Type de contrat à générer</Label>
            <Select
              id="contractType"
              value={contractType}
              onChange={(e) => setContractType(e.target.value as ContractType)}
            >
              {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Montant total (FCFA)</Label>
          <Input
            id="amount"
            type="number"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
          />
        </div>

        {paymentMode === "echelonne" && (
          <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="deposit">Acompte (FCFA)</Label>
              <Input
                id="deposit"
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="months">Mensualités</Label>
              <Input
                id="months"
                type="number"
                min={0}
                value={numMonths}
                onChange={(e) => setNumMonths(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstDue">1ère échéance</Label>
              <Input
                id="firstDue"
                type="date"
                value={firstDueDate}
                onChange={(e) => setFirstDueDate(e.target.value)}
              />
            </div>
            <p className="sm:col-span-3 text-xs text-muted-foreground">
              Un reliquat sera calculé automatiquement après les mensualités pour solder le prix total.
              Contrat provisoire à la signature ; contrat définitif après paiement du reliquat.
            </p>
          </div>
        )}

        {paymentMode === "cash" && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-900">
            Vente cash : le contrat définitif sera disponible après encaissement du paiement comptant
            intégral ({formatFCFA(Number(totalAmount) || 0)}).
          </p>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={loading || !!blockMessage || !propertyId || !clientId}
          >
            {loading ? "Création…" : "Créer la vente et l'échéancier"}
          </Button>
          <Button variant="outline" onClick={() => router.back()} disabled={loading}>
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
