"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import type { Client, Property } from "@/types/database";

interface DealFormProps {
  properties: Property[];
  clients: Client[];
}

export function DealForm({ properties, clients }: DealFormProps) {
  const router = useRouter();
  const [propertyId, setPropertyId] = useState("");
  const [clientId, setClientId] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
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
        if (!totalAmount) {
          setTotalAmount(String(check.property.price_total));
        }
      }
    });
  }, [propertyId, totalAmount]);

  const handleSubmit = async () => {
    setError(null);
    if (blockMessage) return;
    setLoading(true);

    const result = await createDealAction({
      property_id: propertyId,
      client_id: clientId,
      total_amount: Number(totalAmount.replace(/\s/g, "")),
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
              <option key={c.id} value={c.id}>{c.full_name} — {c.phone}</option>
            ))}
          </Select>
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

        <div className="flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={loading || !!blockMessage || !propertyId || !clientId}
          >
            {loading ? "Création…" : "Créer la vente"}
          </Button>
          <Button variant="outline" onClick={() => router.back()} disabled={loading}>
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
