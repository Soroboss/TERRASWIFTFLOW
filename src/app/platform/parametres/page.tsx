import { getPlatformSettings } from "@/lib/actions/platform/stats";
import { requirePlatformSession } from "@/lib/platform/auth";
import { PlatformSettingsForm } from "@/components/platform/platform-settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PlatformSettingsPage() {
  const session = await requirePlatformSession();
  const settings = await getPlatformSettings();
  const isSuperAdmin = session.platformUser.role === "super_admin";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Paramètres plateforme</h1>
        <p className="text-muted-foreground">
          Essai gratuit, tarifs affichés et coordonnées support
        </p>
      </div>

      {isSuperAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Configuration SaaS</CardTitle>
          </CardHeader>
          <CardContent>
            <PlatformSettingsForm settings={settings} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Seuls les super administrateurs peuvent modifier les paramètres.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accès administrateur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Pour le premier accès, définissez{" "}
            <code className="rounded bg-muted px-1">PLATFORM_BOOTSTRAP_EMAILS</code> dans les
            variables d&apos;environnement (e-mails séparés par des virgules).
          </p>
          <p>
            À la première connexion, le compte est promu super administrateur automatiquement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
