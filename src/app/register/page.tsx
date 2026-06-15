import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { PageBackNav } from "@/components/layout/page-back-nav";
import { SetupBanner } from "@/components/setup/setup-banner";
import { TRIAL_DAYS } from "@/lib/pricing";

interface RegisterPageProps {
  searchParams: Promise<{ plan?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { plan } = await searchParams;

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
            {TRIAL_DAYS} jours d&apos;essai gratuit — Starter ou Pro, sans carte bancaire
          </p>
        </div>
        <RegisterForm defaultPlan={plan === "pro" ? "pro" : "starter"} />
      </div>
    </div>
  );
}
