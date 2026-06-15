"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePlatformSettingsAction } from "@/lib/actions/platform/settings";
import type { PlatformSettings } from "@/types/platform";

interface PlatformSettingsFormProps {
  settings: PlatformSettings;
}

export function PlatformSettingsForm({ settings }: PlatformSettingsFormProps) {
  const router = useRouter();
  const [general, setGeneral] = useState(settings.general);
  const [pricing, setPricing] = useState(settings.pricing);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const g = await updatePlatformSettingsAction("general", general);
    if (g.error) {
      setError(g.error);
      setLoading(false);
      return;
    }

    const p = await updatePlatformSettingsAction("pricing", pricing);
    if (p.error) setError(p.error);
    else {
      setMessage("Paramètres enregistrés.");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}

      <section className="space-y-4">
        <h2 className="font-semibold">Général</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nom de l&apos;application</Label>
            <Input
              value={general.app_name}
              onChange={(e) => setGeneral({ ...general, app_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Jours d&apos;essai gratuit</Label>
            <Input
              type="number"
              value={general.trial_days}
              onChange={(e) =>
                setGeneral({ ...general, trial_days: Number(e.target.value) || 14 })
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>E-mail support</Label>
            <Input
              type="email"
              value={general.support_email}
              onChange={(e) => setGeneral({ ...general, support_email: e.target.value })}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold">Tarifs mensuels (FCFA)</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {(["starter_monthly", "pro_monthly", "business_monthly"] as const).map((key) => (
            <div key={key} className="space-y-2">
              <Label className="capitalize">{key.replace("_monthly", "")}</Label>
              <Input
                type="number"
                value={pricing[key]}
                onChange={(e) =>
                  setPricing({ ...pricing, [key]: Number(e.target.value) || 0 })
                }
              />
            </div>
          ))}
        </div>
      </section>

      <Button onClick={save} disabled={loading}>
        {loading ? "Enregistrement…" : "Enregistrer les paramètres"}
      </Button>
    </div>
  );
}
