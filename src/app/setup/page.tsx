import Link from "next/link";
import { CheckCircle2, Circle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInsforgeConfigStatus, isInsforgeConfigured } from "@/lib/env";
import { createClient } from "@/lib/insforge/server";

async function testConnection(): Promise<{ ok: boolean; message: string }> {
  if (!isInsforgeConfigured()) {
    return { ok: false, message: "Variables d'environnement invalides ou placeholder." };
  }

  try {
    const insforge = await createClient();
    const { error } = await insforge.database.from("organizations").select("id").limit(1);
    if (error?.message.includes("does not exist") || error?.code === "42P01") {
      return {
        ok: false,
        message: "Connexion OK mais tables manquantes — importez insforge/schema.sql.",
      };
    }
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true, message: "Connexion InsForge et tables OK." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Erreur de connexion" };
  }
}

export default async function SetupPage() {
  const config = getInsforgeConfigStatus();
  const connection = config.configured ? await testConnection() : null;

  const steps = [
    {
      done: config.hasUrl && !config.url.includes("placeholder"),
      label: "NEXT_PUBLIC_INSFORGE_URL dans .env.local",
    },
    {
      done: config.hasAnonKey && config.configured,
      label: "NEXT_PUBLIC_INSFORGE_ANON_KEY dans .env.local",
    },
    {
      done: config.hasApiKey && config.configured,
      label: "INSFORGE_API_KEY dans .env.local",
    },
    {
      done: connection?.ok ?? false,
      label: "Schéma SQL importé (tables créées)",
    },
  ];

  return (
    <div className="min-h-screen bg-muted/20 px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="text-center">
          <Link href="/" className="text-sm text-primary hover:underline">
            ← Retour à l&apos;accueil
          </Link>
          <h1 className="mt-4 text-3xl font-bold">Configuration locale</h1>
          <p className="mt-2 text-muted-foreground">
            Suivez ces étapes pour tester TerraSwiftFlow sur votre machine.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>État de la configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map((step) => (
              <div key={step.label} className="flex items-center gap-3 text-sm">
                {step.done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                )}
                <span className={step.done ? "text-foreground" : "text-muted-foreground"}>
                  {step.label}
                </span>
              </div>
            ))}
            {connection && !connection.ok && (
              <div className="mt-4 flex gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800">
                <XCircle className="h-5 w-5 shrink-0" />
                {connection.message}
              </div>
            )}
            {connection?.ok && (
              <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
                {connection.message} — vous pouvez{" "}
                <Link href="/register" className="font-semibold underline">
                  créer un compte
                </Link>
                .
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Étape 1 — Projet InsForge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              1. Liez le projet :{" "}
              <code className="rounded bg-muted px-1">npx @insforge/cli link</code>
            </p>
            <p>
              2. Récupérez la clé anon :{" "}
              <code className="rounded bg-muted px-1">npx @insforge/cli secrets get ANON_KEY</code>
            </p>
            <p>
              3. Copiez l&apos;URL OSS et la clé API admin depuis{" "}
              <code className="rounded bg-muted px-1">.insforge/project.json</code> dans{" "}
              <code className="rounded bg-muted px-1">.env.local</code>.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Étape 2 — Schéma SQL + Storage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-zinc-100 text-xs">
{`npx @insforge/cli db import insforge/schema.sql
npx @insforge/cli storage create-bucket property-photos --public
npx @insforge/cli storage create-bucket masterplan-images --public`}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Étape 3 — Lancer l&apos;app</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-zinc-100">
{`npm install
npm run dev`}
            </pre>
            <p className="text-muted-foreground">
              Ouvrez{" "}
              <a href="http://localhost:3000" className="text-primary underline">
                http://localhost:3000
              </a>{" "}
              puis inscrivez-vous.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/">Accueil</Link>
          </Button>
          <Button asChild disabled={!connection?.ok}>
            <Link href="/register">Créer un compte test</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
