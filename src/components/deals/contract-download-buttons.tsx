import Link from "next/link";
import { FileText, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canDownloadContractStage } from "@/lib/sales-contract";
import type { ContractStage, Deal } from "@/types/database";

interface ContractDownloadButtonsProps {
  deal: Pick<Deal, "id" | "contract_stage" | "payment_mode" | "contract_type">;
}

export function ContractDownloadButtons({ deal }: ContractDownloadButtonsProps) {
  const canProvisoire = canDownloadContractStage(deal, "provisoire");
  const canDefinitif = canDownloadContractStage(deal, "definitif");

  return (
    <div className="flex flex-wrap gap-2">
      {canProvisoire && (
        <Button variant="outline" asChild>
          <Link href={`/api/documents/contract/${deal.id}?stage=provisoire`} target="_blank">
            <FileText className="h-4 w-4" />
            Contrat provisoire
          </Link>
        </Button>
      )}
      {canDefinitif ? (
        <Button variant="outline" asChild>
          <Link href={`/api/documents/contract/${deal.id}?stage=definitif`} target="_blank">
            <FileCheck className="h-4 w-4" />
            Contrat définitif
          </Link>
        </Button>
      ) : (
        <Button variant="outline" disabled title="Disponible après paiement intégral (cash ou reliquat)">
          <FileCheck className="h-4 w-4" />
          Contrat définitif (après solde)
        </Button>
      )}
    </div>
  );
}
