import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { SetupBanner } from "@/components/setup/setup-banner";
import { getSessionContext } from "@/lib/auth";
import { getPlatformSession } from "@/lib/platform/auth";

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const [tenantSession, platformSession] = await Promise.all([
    getSessionContext(),
    getPlatformSession(),
  ]);

  if (tenantSession || platformSession) {
    if (next?.startsWith("/platform") && platformSession) redirect(next);
    if (tenantSession) redirect("/dashboard");
    if (platformSession) redirect("/platform");
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SetupBanner />
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-bold text-primary hover:opacity-90">
            TerraSwiftFlow
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestion immobilière — Côte d&apos;Ivoire
          </p>
        </div>
        <LoginForm nextPath={next} />
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Administrateur SaaS ?{" "}
          <Link href="/login?next=/platform" className="text-primary hover:underline">
            Accès plateforme
          </Link>
        </p>
      </div>
    </div>
  );
}
