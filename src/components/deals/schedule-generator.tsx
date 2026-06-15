"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateScheduleAction } from "@/lib/actions/deals";

interface ScheduleGeneratorProps {
  dealId: string;
  totalAmount: number;
}

export function ScheduleGenerator({ dealId, totalAmount }: ScheduleGeneratorProps) {
  const [downPayment, setDownPayment] = useState(String(Math.round(totalAmount * 0.3)));
  const [numMonths, setNumMonths] = useState("12");
  const [firstDueDate, setFirstDueDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    const result = await generateScheduleAction({
      deal_id: dealId,
      down_payment: Number(downPayment),
      num_months: Number(numMonths),
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
        <CardTitle className="text-lg">Générer l&apos;échéancier</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="down">Acompte (FCFA)</Label>
            <Input id="down" type="number" value={downPayment} onChange={(e) => setDownPayment(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="months">Mensualités</Label>
            <Input id="months" type="number" value={numMonths} onChange={(e) => setNumMonths(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="firstDue">1ère échéance</Label>
            <Input id="firstDue" type="date" value={firstDueDate} onChange={(e) => setFirstDueDate(e.target.value)} />
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? "Génération…" : "Générer acompte + mensualités + solde"}
        </Button>
      </CardContent>
    </Card>
  );
}
