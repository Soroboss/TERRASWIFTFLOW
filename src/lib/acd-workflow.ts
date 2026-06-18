import type { AcdStatus } from "@/types/database";

export const ACD_STATUS_ORDER: AcdStatus[] = [
  "non_demarre",
  "dossier_depose",
  "bornage",
  "en_administration",
  "delivre",
];

export const ACD_STATUS_LABELS: Record<AcdStatus, string> = {
  non_demarre: "Non démarré",
  dossier_depose: "Dossier déposé",
  bornage: "Bornage / géomètre",
  en_administration: "En administration",
  delivre: "ACD / titre délivré",
};

export const ACD_STATUS_DESCRIPTIONS: Record<AcdStatus, string> = {
  non_demarre: "Procédure foncière pas encore lancée.",
  dossier_depose: "Dossier transmis au service compétent.",
  bornage: "Bornage ou levé topographique en cours.",
  en_administration: "Instruction administrative (sous-préfecture, cadastre…).",
  delivre: "Titre ou ACD remis à l'acquéreur.",
};

export function acdProgressPercent(status: AcdStatus): number {
  const idx = ACD_STATUS_ORDER.indexOf(status);
  if (idx < 0) return 0;
  return Math.round((idx / (ACD_STATUS_ORDER.length - 1)) * 100);
}
