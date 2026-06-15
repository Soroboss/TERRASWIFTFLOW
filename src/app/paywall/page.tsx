import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function PaywallPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Votre essai est terminé</CardTitle>
          <CardDescription>
            Continuez à gérer vos terrains et maisons sans Excel ni WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-background p-4">
            <p className="font-semibold">Starter — 25 000 FCFA / mois</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>• Biens illimités</li>
              <li>• Clients & échéanciers</li>
              <li>• Reçus & contrats PDF</li>
              <li>• Paiements Wave / Orange Money / MTN MoMo</li>
            </ul>
          </div>

          <p className="text-sm text-muted-foreground">
            Contactez-nous pour activer votre abonnement. Paiement mobile money accepté.
          </p>

          <div className="flex gap-3">
            <Button asChild>
              <a href="mailto:contact@terraswiftflow.ci">Nous contacter</a>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">Retour</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
