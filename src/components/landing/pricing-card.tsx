import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFcfa, type PricingPlan } from "@/lib/pricing";

interface PricingCardProps {
  plan: PricingPlan;
}

export function PricingCard({ plan }: PricingCardProps) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-card p-8 shadow-sm ${
        plan.highlighted ? "border-2 border-primary shadow-lg ring-1 ring-primary/20" : ""
      }`}
    >
      {plan.badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
          {plan.badge}
        </span>
      )}

      <div>
        <p className="text-sm font-medium text-primary">{plan.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-emerald-700">
          {plan.trialDays} jours gratuits
        </p>
        <p className="mt-2">
          <span className="text-4xl font-bold">{formatFcfa(plan.priceMonthly)}</span>
          <span className="text-muted-foreground"> FCFA / mois ensuite</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Sans carte bancaire pendant l&apos;essai
        </p>
      </div>

      <ul className="mt-6 flex-1 space-y-3 text-sm">
        {plan.features.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{item}</span>
          </li>
        ))}
        {plan.limits.map((item) => (
          <li key={item} className="flex items-start gap-2 text-muted-foreground">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <Button className="mt-8 w-full" size="lg" variant={plan.highlighted ? "default" : "outline"} asChild>
        <Link href={`/register?plan=${plan.id}`}>
          Essai {plan.trialDays} jours — {plan.name}
        </Link>
      </Button>
    </div>
  );
}
