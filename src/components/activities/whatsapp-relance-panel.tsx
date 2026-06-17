"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  buildWhatsAppUrl,
  getWhatsAppMessageForTemplate,
  WHATSAPP_RELANCE_TEMPLATES,
  type WhatsAppRelanceContext,
} from "@/lib/whatsapp-relance";

interface WhatsAppRelancePanelProps extends WhatsAppRelanceContext {
  phone: string;
  variant?: "compact" | "full";
  className?: string;
  onOpenWhatsApp?: () => void;
}

export function WhatsAppRelancePanel({
  phone,
  variant = "full",
  className,
  onOpenWhatsApp,
  ...context
}: WhatsAppRelancePanelProps) {
  const [templateId, setTemplateId] = useState(WHATSAPP_RELANCE_TEMPLATES[0].id);
  const [message, setMessage] = useState("");
  const [expanded, setExpanded] = useState(variant === "full");

  const contextKey = useMemo(
    () =>
      JSON.stringify({
        clientName: context.clientName,
        organizationName: context.organizationName,
        agentName: context.agentName,
        dueDate: context.dueDate,
        propertyTitle: context.propertyTitle,
        amountDue: context.amountDue,
      }),
    [context]
  );

  useEffect(() => {
    setMessage(getWhatsAppMessageForTemplate(templateId, context));
  }, [templateId, contextKey]);

  const whatsappUrl = buildWhatsAppUrl(phone, message);
  const canSend = Boolean(phone && whatsappUrl);

  const handleOpen = () => {
    if (!canSend) return;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    onOpenWhatsApp?.();
  };

  if (variant === "compact" && !expanded) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-1.5 border-emerald-200 text-emerald-800 hover:bg-emerald-50"
        onClick={() => setExpanded(true)}
        disabled={!phone}
        title={phone ? "Relancer par WhatsApp" : "Numéro client manquant"}
      >
        <MessageCircle className="h-4 w-4" />
        WhatsApp
      </Button>
    );
  }

  const panel = (
    <div
      className={
        variant === "full"
          ? "space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4"
          : "mt-3 space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3"
      }
    >
      <div className="flex items-center gap-2 text-sm font-medium text-emerald-900">
        <MessageCircle className="h-4 w-4" />
        Relance WhatsApp — {context.clientName}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`wa-template-${phone}`}>Message préparé</Label>
        <Select
          id={`wa-template-${phone}`}
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
        >
          {WHATSAPP_RELANCE_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`wa-message-${phone}`}>Aperçu (modifiable)</Label>
        <Textarea
          id={`wa-message-${phone}`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={variant === "full" ? 8 : 6}
          className="bg-white text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={handleOpen}
          disabled={!canSend || !message.trim()}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          <MessageCircle className="h-4 w-4" />
          Ouvrir WhatsApp
        </Button>
        {variant === "compact" && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded(false)}>
            Fermer
          </Button>
        )}
      </div>
    </div>
  );

  if (className) {
    return <div className={className}>{panel}</div>;
  }

  return panel;
}
