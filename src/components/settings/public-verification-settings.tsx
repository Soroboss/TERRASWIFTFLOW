"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePublicSlugAction } from "@/lib/actions/organization-settings";

interface PublicVerificationSettingsProps {
  organizationName: string;
  publicSlug: string | null;
}

export function PublicVerificationSettings({
  organizationName,
  publicSlug,
}: PublicVerificationSettingsProps) {
  const router = useRouter();
  const [slug, setSlug] = useState(publicSlug ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const save = () => {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updatePublicSlugAction(slug);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      router.refresh();
    });
  };

  const displaySlug = slug.trim() || "votre-programme";

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
        <div>
          <p className="font-medium">Vérification publique de parcelle</p>
          <p className="text-sm text-muted-foreground">
            Permettez à vos acquéreurs de vérifier qu&apos;un lot est libre sur{" "}
            <Link href="/verifier" className="text-primary hover:underline">
              /verifier
            </Link>
            . Différenciateur vs agences généralistes.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="public_slug">Identifiant public du programme</Label>
          <Input
            id="public_slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={organizationName.toLowerCase().replace(/\s+/g, "-")}
          />
          <p className="text-xs text-muted-foreground">
            Les acquéreurs saisissent « {displaySlug} » + la référence lot (ex. A31).
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-700">Identifiant public enregistré.</p>}

      <Button type="button" size="sm" onClick={save} disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </div>
  );
}
