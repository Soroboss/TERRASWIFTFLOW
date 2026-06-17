"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CancelDealForm } from "@/components/deals/cancel-deal-form";
import { markDealSoldeAction } from "@/lib/actions/deals";
import type { DealStatus } from "@/types/database";

interface DealActionsProps {
  dealId: string;
  status: DealStatus;
  remaining: number;
  totalPaid: number;
}

export function DealActions({ dealId, status, remaining, totalPaid }: DealActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);

  if (status !== "en_cours") return null;

  if (showCancelForm) {
    return (
      <CancelDealForm
        dealId={dealId}
        totalPaid={totalPaid}
        onClose={() => setShowCancelForm(false)}
      />
    );
  }

  const handleSolde = async () => {
    setLoading(true);
    const result = await markDealSoldeAction(dealId);
    if (result?.error) {
      alert(result.error);
      setLoading(false);
      return;
    }
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleSolde} disabled={loading || remaining > 0}>
        Marquer soldé
      </Button>
      <Button variant="destructive" onClick={() => setShowCancelForm(true)} disabled={loading}>
        Annuler la vente
      </Button>
    </div>
  );
}
