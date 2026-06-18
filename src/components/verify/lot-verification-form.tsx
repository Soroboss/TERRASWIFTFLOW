"use client";

import { useState, useTransition } from "react";
import { Search, ShieldCheck, MapPin, BadgeCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { verifyLotPublicAction, type LotVerificationResult } from "@/lib/actions/verify-lot";
import { PROPERTY_STATUS_LABELS } from "@/lib/property-status";
import { formatFCFA, formatDate } from "@/lib/format";
import Link from "next/link";

export function LotVerificationForm() {
  const [orgSlug, setOrgSlug] = useState("");
  const [reference, setReference] = useState("");
  const [result, setResult] = useState<LotVerificationResult | null>(null);
  const [pending, startTransition] = useTransition();

  const verify = () => {
    startTransition(async () => {
      const res = await verifyLotPublicAction({
        organization_slug: orgSlug,
        reference,
      });
      setResult(res);
    });
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Vérifier un lot
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Entrez le nom du programme et la référence du lot (ex. A31). Service gratuit — comme une
            vérification cadastrale simplifiée pour acquéreurs et notaires.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org">Programme / promoteur</Label>
            <Input
              id="org"
              value={orgSlug}
              onChange={(e) => setOrgSlug(e.target.value)}
              placeholder="Ex. résidence-palmiers ou nom du lotissement"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ref">Référence ou n° de lot</Label>
            <Input
              id="ref"
              value={reference}
              onChange={(e) => setReference(e.target.value.toUpperCase())}
              placeholder="Ex. A31"
            />
          </div>
          <Button type="button" className="w-full gap-2" onClick={verify} disabled={pending}>
            <Search className="h-4 w-4" />
            {pending ? "Vérification…" : "Vérifier le statut"}
          </Button>
        </CardContent>
      </Card>

      {result && !result.found && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="flex gap-3 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            {result.error ?? "Lot introuvable."}
          </CardContent>
        </Card>
      )}

      {result?.found && (
        <Card className="border-emerald-200 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-emerald-700">
              <BadgeCheck className="h-5 w-5" />
              <span className="text-sm font-medium">Certificat de vérification TerraSwiftFlow</span>
            </div>
            <CardTitle className="text-xl">{result.lot_title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {result.organization_name}
              {result.program_name && ` · ${result.program_name}`}
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">
                Réf. {result.lot_reference}
              </span>
              {result.lot_number && (
                <span className="rounded-full bg-slate-100 px-3 py-1">Lot {result.lot_number}</span>
              )}
              <span
                className={
                  result.status === "libre"
                    ? "rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800"
                    : result.status === "reserve"
                      ? "rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-900"
                      : "rounded-full bg-red-100 px-3 py-1 font-semibold text-red-800"
                }
              >
                {result.status && PROPERTY_STATUS_LABELS[result.status]}
              </span>
            </div>

            {result.location_label && (
              <p className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                {result.location_label}
              </p>
            )}

            {result.price_total != null && (
              <p className="font-semibold text-primary">{formatFCFA(result.price_total)}</p>
            )}

            {result.occupied && result.status !== "libre" && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950">
                Ce lot est <strong>réservé ou vendu</strong> — une vente active est enregistrée. Les
                détails de l&apos;acquéreur restent confidentiels.
              </p>
            )}

            {result.status === "libre" && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-900">
                Ce lot est <strong>disponible</strong> selon les registres du promoteur au{" "}
                {result.verified_at && formatDate(result.verified_at)}.
              </p>
            )}

            <p className="text-[11px] text-muted-foreground">
              Vérification effectuée le{" "}
              {result.verified_at && formatDate(result.verified_at)} — source : registre interne
              certifié anti-double-vente TerraSwiftFlow.
            </p>
          </CardContent>
        </Card>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Vous êtes promoteur ?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Activez la vérification publique sur TerraSwiftFlow
        </Link>
      </p>
    </div>
  );
}
