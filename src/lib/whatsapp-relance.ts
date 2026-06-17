import { formatDate } from "@/lib/format";

export interface WhatsAppRelanceContext {
  clientName: string;
  organizationName: string;
  agentName: string;
  dueDate?: string | null;
  propertyTitle?: string | null;
  amountDue?: string | null;
}

export interface WhatsAppRelanceTemplate {
  id: string;
  label: string;
  body: string;
}

export const WHATSAPP_RELANCE_TEMPLATES: WhatsAppRelanceTemplate[] = [
  {
    id: "rappel_echeance",
    label: "Rappel échéance de paiement",
    body: `Bonjour {clientName},

Nous vous contactons de la part de {organizationName} pour vous rappeler votre prochaine échéance{dueDateLine}.

Merci de nous confirmer votre paiement ou de nous signaler toute difficulté.

Cordialement,
{agentName}`,
  },
  {
    id: "retard_paiement",
    label: "Paiement en retard",
    body: `Bonjour {clientName},

Sauf erreur de notre part, un versement attendu auprès de {organizationName} n'a pas encore été reçu{dueDateLine}{amountLine}.

Pouvez-vous nous indiquer la date de règlement ou nous contacter pour trouver une solution ?

Merci,
{agentName}`,
  },
  {
    id: "rappel_visite",
    label: "Rappel de visite terrain",
    body: `Bonjour {clientName},

Nous vous rappelons votre visite prévue chez {organizationName}{dueDateLine}{propertyLine}.

Merci de confirmer votre présence ou de nous proposer un autre créneau.

À bientôt,
{agentName}`,
  },
  {
    id: "suivi_proposition",
    label: "Suivi après proposition",
    body: `Bonjour {clientName},

Suite à notre échange, {organizationName} reste à votre disposition pour finaliser votre projet{propertyLine}.

N'hésitez pas à nous répondre sur WhatsApp pour toute question.

Cordialement,
{agentName}`,
  },
  {
    id: "remerciement_paiement",
    label: "Remerciement après paiement",
    body: `Bonjour {clientName},

Nous accusons réception de votre paiement et vous remercions pour votre confiance envers {organizationName}.

Votre reçu est disponible sur demande.

Bien cordialement,
{agentName}`,
  },
  {
    id: "relance_douce",
    label: "Relance amicale",
    body: `Bonjour {clientName},

J'espère que vous allez bien. Je me permets de vous relancer concernant votre dossier chez {organizationName}.

Pouvez-vous me donner de vos nouvelles ?

Merci,
{agentName}`,
  },
];

export function phoneToWhatsAppId(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("225")) return digits;
  if (digits.length === 10) return `225${digits}`;
  return digits;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const id = phoneToWhatsAppId(phone);
  if (!id) return "";
  return `https://wa.me/${id}?text=${encodeURIComponent(message)}`;
}

export function fillWhatsAppTemplate(
  template: string,
  context: WhatsAppRelanceContext
): string {
  const dueDateLine = context.dueDate
    ? ` prévue le ${formatDate(context.dueDate)}`
    : "";
  const amountLine = context.amountDue ? ` (${context.amountDue})` : "";
  const propertyLine = context.propertyTitle
    ? ` concernant le bien : ${context.propertyTitle}`
    : "";

  return template
    .replaceAll("{clientName}", context.clientName)
    .replaceAll("{organizationName}", context.organizationName)
    .replaceAll("{agentName}", context.agentName)
    .replaceAll("{dueDateLine}", dueDateLine)
    .replaceAll("{amountLine}", amountLine)
    .replaceAll("{propertyLine}", propertyLine)
    .trim();
}

export function getWhatsAppMessageForTemplate(
  templateId: string,
  context: WhatsAppRelanceContext
): string {
  const template =
    WHATSAPP_RELANCE_TEMPLATES.find((t) => t.id === templateId) ??
    WHATSAPP_RELANCE_TEMPLATES[0];
  return fillWhatsAppTemplate(template.body, context);
}
