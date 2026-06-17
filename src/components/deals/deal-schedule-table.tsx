"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateScheduleLineAction } from "@/lib/actions/deals";
import { recordPaymentAction } from "@/lib/actions/payments";
import { formatDate, formatFCFA } from "@/lib/format";
import type { PaymentMethod } from "@/types/database";
import type { ScheduleWithPayments } from "@/types/entities";
import { PAYMENT_METHOD_LABELS } from "@/types/entities";
import { cn } from "@/lib/utils";

interface DealScheduleTableProps {
  dealId: string;
  schedules: ScheduleWithPayments[];
  readOnly?: boolean;
}

export function DealScheduleTable({ dealId, schedules, readOnly = false }: DealScheduleTableProps) {
  const [payScheduleId, setPayScheduleId] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("wave");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReceipt, setLastReceipt] = useState<{ id: string; number: string } | null>(null);

  const handlePayment = async () => {
    if (!payScheduleId) return;
    setLoading(true);
    setError(null);

    const result = await recordPaymentAction({
      deal_id: dealId,
      schedule_id: payScheduleId,
      amount: Number(payAmount),
      method: payMethod,
      paid_at: `${payDate}T12:00:00.000Z`,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.paymentId && result.receiptNumber) {
      setLastReceipt({ id: result.paymentId, number: result.receiptNumber });
    }
    setPayScheduleId("");
    setPayAmount("");
    setLoading(false);
  };

  const handleEditLine = async (schedule: ScheduleWithPayments) => {
    const newAmount = prompt("Nouveau montant (FCFA)", String(schedule.amount_due));
    if (!newAmount) return;
    const newDate = prompt("Nouvelle date (AAAA-MM-JJ)", schedule.due_date);
    if (!newDate) return;
    await updateScheduleLineAction({
      schedule_id: schedule.id,
      deal_id: dealId,
      amount_due: Number(newAmount),
      due_date: newDate,
      label: schedule.label,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Échéancier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {schedules.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun échéancier généré.</p>
          ) : (
            schedules.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between",
                  s.is_overdue && !s.is_paid && "border-red-300 bg-red-50",
                  s.is_paid && "border-emerald-200 bg-emerald-50"
                )}
              >
                <div>
                  <p className="font-medium">{s.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(s.due_date)} · {formatFCFA(s.amount_due)}
                    {s.paid_amount > 0 && ` · Payé : ${formatFCFA(s.paid_amount)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">
                    {s.is_paid ? "Soldé" : s.is_overdue ? "En retard" : "À venir"}
                  </span>
                  {!readOnly && (
                    <Button variant="ghost" size="sm" onClick={() => handleEditLine(s)}>
                      Modifier
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {!readOnly && schedules.some((s) => !s.is_paid) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Enregistrer un versement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="schedule">Échéance</Label>
                <Select
                  id="schedule"
                  value={payScheduleId}
                  onChange={(e) => {
                    setPayScheduleId(e.target.value);
                    const s = schedules.find((x) => x.id === e.target.value);
                    if (s) setPayAmount(String(s.amount_due - s.paid_amount));
                  }}
                >
                  <option value="">— Sélectionner —</option>
                  {schedules.filter((s) => !s.is_paid).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} — reste {formatFCFA(s.amount_due - s.paid_amount)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payAmount">Montant (FCFA)</Label>
                <Input id="payAmount" type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">Méthode</Label>
                <Select id="method" value={payMethod} onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}>
                  {(Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payDate">Date</Label>
                <Input id="payDate" type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
              </div>
            </div>

            <Button onClick={handlePayment} disabled={loading || !payScheduleId}>
              {loading ? "Enregistrement…" : "Enregistrer le versement"}
            </Button>

            {lastReceipt && (
              <p className="text-sm text-emerald-700">
                Reçu {lastReceipt.number} généré —{" "}
                <Link href={`/api/documents/receipt/${lastReceipt.id}`} target="_blank" className="underline">
                  Télécharger PDF
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
