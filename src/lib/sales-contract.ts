import type {
  ContractStage,
  ContractType,
  Deal,
  PaymentMode,
} from "@/types/database";
import type { ScheduleLineInput } from "@/lib/schedule";

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  cash: "Paiement cash (comptant)",
  echelonne: "Paiement échelonné",
};

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  acd: "ACD (Acte de cession définitive)",
  lettre_villageoise: "Lettre villageoise",
  approbation_travaux: "Approbation de travaux",
};

export const CONTRACT_STAGE_LABELS: Record<ContractStage, string> = {
  provisoire: "Contrat provisoire",
  definitif: "Contrat définitif",
};

export const SCHEDULE_LINE_TYPE_LABELS = {
  acompte: "Acompte",
  mensualite: "Mensualité",
  reliquat: "Reliquat",
  cash: "Paiement comptant",
} as const;

export function contractTypeDescription(type: ContractType): string {
  switch (type) {
    case "acd":
      return "titre foncier urbanisé ou lotissement régularisé, formalisé par un acte de cession définitive (ACD)";
    case "lettre_villageoise":
      return "terrain de régime villageois ou coutumier, formalisé par une lettre villageoise";
    case "approbation_travaux":
      return "opération de construction ou VEFA, formalisée par une approbation de travaux";
  }
}

export function canDownloadContractStage(
  deal: Pick<Deal, "contract_stage" | "payment_mode">,
  requested: ContractStage
): boolean {
  if (requested === "provisoire") {
    return deal.payment_mode === "echelonne" && deal.contract_stage === "provisoire";
  }
  return deal.contract_stage === "definitif";
}

export function shouldPromoteToDefinitiveContract(
  remaining: number,
  paymentMode: PaymentMode
): boolean {
  if (remaining > 0) return false;
  return true;
}

export function computeBalanceFromLines(
  totalAmount: number,
  depositAmount: number,
  lines: ScheduleLineInput[]
): number {
  const reliquat = lines.find((l) => l.line_type === "reliquat");
  if (reliquat) return reliquat.amount_due;
  const cash = lines.find((l) => l.line_type === "cash");
  if (cash) return 0;
  return Math.max(0, totalAmount - depositAmount);
}

export function formatFcfaPdf(amount: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(amount).replace(/\u202f/g, " ")} FCFA`;
}
