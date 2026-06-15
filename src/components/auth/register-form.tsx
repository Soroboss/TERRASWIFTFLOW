"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { registerAction } from "@/lib/actions/auth";

export function RegisterForm() {
  const [fullName, setFullName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError(null);
    setLoading(true);

    const result = await registerAction({
      email,
      password,
      fullName,
      organizationName,
      phone,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Créer votre compte</CardTitle>
        <CardDescription>
          14 jours d&apos;essai gratuit — gestion immobilière pour la Côte d&apos;Ivoire
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-2">
          <Label htmlFor="org">Nom de l&apos;entreprise</Label>
          <Input
            id="org"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            placeholder="Ex. Foncière Les Palmiers SARL"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName">Votre nom complet</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ex. Kouassi Jean-Baptiste"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone (+225)</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07 07 12 34 56"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Adresse e-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@entreprise.ci"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 caractères"
          />
        </div>

        <Button className="w-full" onClick={handleRegister} disabled={loading}>
          {loading ? "Création…" : "Démarrer l'essai gratuit"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Déjà inscrit ?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
