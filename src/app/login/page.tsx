import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { SetupBanner } from "@/components/setup/setup-banner";

export default function LoginPage() {
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
        <LoginForm />
      </div>
    </div>
  );
}
