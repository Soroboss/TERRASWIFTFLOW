"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createMasterplanAction } from "@/lib/actions/masterplans";

export function MasterplanCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [totalLots, setTotalLots] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setError(null);
    setLoading(true);
    const result = await createMasterplanAction(name, Number(totalLots) || 0);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouveau plan de masse</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Nom du projet</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex. Résidence Les Palmiers"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lots">Nombre total de lots</Label>
          <Input
            id="lots"
            type="number"
            value={totalLots}
            onChange={(e) => setTotalLots(e.target.value)}
            placeholder="120"
          />
        </div>

        <div className="flex gap-3">
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? "Création…" : "Créer le plan"}
          </Button>
          <Button variant="outline" onClick={() => router.back()} disabled={loading}>
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
