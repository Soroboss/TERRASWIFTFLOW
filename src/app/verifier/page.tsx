import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { LotVerificationForm } from "@/components/verify/lot-verification-form";

export const metadata = {
  title: "Vérifier un lot — TerraSwiftFlow",
  description:
    "Vérifiez gratuitement le statut d'une parcelle (libre, réservée, vendue) auprès de votre promoteur en Côte d'Ivoire.",
};

export default function VerifierPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            TerraSwiftFlow
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
            <ShieldCheck className="h-4 w-4" />
            Vérification parcelle
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Vérification publique de parcelle
          </h1>
          <p className="mt-2 text-muted-foreground">
            Protégez-vous contre la double vente — vérifiez qu&apos;un lot est bien libre avant
            d&apos;acheter.
          </p>
        </div>
        <LotVerificationForm />
      </main>
    </div>
  );
}
