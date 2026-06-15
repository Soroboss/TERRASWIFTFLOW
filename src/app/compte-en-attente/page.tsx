import Link from "next/link";
import { PageBackNav } from "@/components/layout/page-back-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logoutAction } from "@/lib/actions/auth";

export default function PendingAccountPage() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <div className="mx-auto w-full max-w-lg p-4">
        <PageBackNav />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center p-4 pt-0">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Compte sans organisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Votre compte est connecté mais n&apos;est rattaché à aucune organisation cliente.
            </p>
            <p>
              Si vous êtes <strong className="text-foreground">collaborateur d&apos;une entreprise</strong>,
              demandez à votre responsable de vous créer un accès depuis son espace{" "}
              <strong className="text-foreground">Équipe</strong>, puis reconnectez-vous.
            </p>
            <p>
              Si vous êtes <strong className="text-foreground">staff TerraSwiftFlow</strong>, utilisez
              l&apos;accès admin plateforme.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Button asChild>
                <Link href="/register">Créer une nouvelle organisation</Link>
              </Button>
              <form action={logoutAction}>
                <Button type="submit" variant="outline" className="w-full">
                  Se déconnecter
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
