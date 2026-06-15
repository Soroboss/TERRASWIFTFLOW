import { MessageCircle } from "lucide-react";
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP } from "@/lib/support-contacts";

interface PaymentSupportContactsProps {
  compact?: boolean;
}

export function PaymentSupportContacts({ compact = false }: PaymentSupportContactsProps) {
  if (compact) {
    return (
      <p className="text-xs text-muted-foreground">
        Paiement bloqué ? WhatsApp{" "}
        {SUPPORT_WHATSAPP.map((contact, index) => (
          <span key={contact.href}>
            {index > 0 && " ou "}
            <a
              href={contact.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {contact.label}
            </a>
          </span>
        ))}
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 text-sm">
      <div className="flex items-start gap-3">
        <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div className="space-y-2">
          <p className="font-medium text-emerald-900">
            Le paiement ne passe pas ? Contactez-nous
          </p>
          <p className="text-muted-foreground">
            Écrivez-nous sur WhatsApp pour activer votre abonnement manuellement :
          </p>
          <ul className="space-y-1">
            {SUPPORT_WHATSAPP.map((contact) => (
              <li key={contact.href}>
                <a
                  href={contact.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  {contact.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground">
            Ou par e-mail :{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
              {SUPPORT_EMAIL}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
