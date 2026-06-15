import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { PageBackNav } from "@/components/layout/page-back-nav";
import { SetupBanner } from "@/components/setup/setup-banner";
import { getSessionContext } from "@/lib/auth";
import { getPlatformSession } from "@/lib/platform/auth";

export default async function LoginPage() {
  const [tenantSession, platformSession] = await Promise.all([
    getSessionContext(),
    getPlatformSession(),
  ]);

  if (tenantSession || platformSession) {
    if (tenantSession) redirect("/dashboard");
    if (platformSession) redirect("/platform");
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SetupBanner />
      <div className="mx-auto w-full max-w-lg p-4">
        <PageBackNav />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center p-4 pt-0">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-bold text-primary hover:opacity-90">
            TerraSwiftFlow
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestion immobilière — Côte d&apos;Ivoire
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
