"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cancelDealAction, markDealSoldeAction } from "@/lib/actions/deals";
import type { DealStatus } from "@/types/database";

interface DealActionsProps {
  dealId: string;
  status: DealStatus;
  remaining: number;
}

export function DealActions({ dealId, status, remaining }: DealActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (status !== "en_cours") return null;

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

  const handleCancel = async () => {
    if (!confirm("Annuler cette vente ? Le bien redeviendra libre.")) return;
    setLoading(true);
    await cancelDealAction(dealId);
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleSolde} disabled={loading || remaining > 0}>
        Marquer soldé
      </Button>
      <Button variant="destructive" onClick={handleCancel} disabled={loading}>
        Annuler
      </Button>
    </div>
  );
}
