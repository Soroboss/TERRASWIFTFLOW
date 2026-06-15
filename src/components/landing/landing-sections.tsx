import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Building2,
  FileText,
  Map,
  Shield,
  Smartphone,
  Wallet,
} from "lucide-react";

const FEATURES = [
  {
    icon: Shield,
    title: "Anti-double-vente",
    description:
      "Impossible de vendre deux fois la même parcelle. Blocage automatique si un lot est déjà réservé ou vendu.",
  },
  {
    icon: Map,
    title: "Plan de masse interactif",
    description:
      "Visualisez vos lots en couleur : libre, réservé, vendu. Un clic = fiche bien ou vente en cours.",
  },
  {
    icon: Wallet,
    title: "Paiement échelonné",
    description:
      "Acompte, mensualités et solde. Suivi des encaissements Wave, Orange Money, MTN MoMo et espèces.",
  },
  {
    icon: FileText,
    title: "Reçus & contrats PDF",
    description:
      "Générez un reçu ou un contrat en 30 secondes. Montants en FCFA, dates au format ivoirien.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first",
    description:
      "Conçu pour les agents sur le terrain. Saisie rapide, interface en français.",
  },
  {
    icon: Building2,
    title: "Terrains & maisons VEFA",
    description:
      "Lotisseurs et promoteurs fonciers. Pas de locatif, pas de syndic — 100 % vente échelonnée.",
  },
];

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-primary">
          TerraSwiftFlow
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <a href="#fonctionnalites" className="text-muted-foreground hover:text-foreground">
            Fonctionnalités
          </a>
          <a href="#tarifs" className="text-muted-foreground hover:text-foreground">
            Tarifs
          </a>
          <Link href="/login" className="text-muted-foreground hover:text-foreground">
            Connexion
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
            <Link href="/login">Connexion</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">Essai gratuit</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/80 to-background px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
            Côte d&apos;Ivoire · FCFA · Wave / Orange Money / MTN
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Ne vendez plus jamais{" "}
            <span className="text-primary">la même parcelle deux fois</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
            TerraSwiftFlow remplace Excel + WhatsApp + reçus papier. Gérez terrains,
            maisons VEFA et paiements échelonnés — plan de masse, échéanciers et PDF
            en un seul outil.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/register">Démarrer l&apos;essai — 14 jours gratuits</Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
              <Link href="/login">Se connecter</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Sans carte bancaire · Configuration en 5 minutes
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-3">
          {[
            { value: "0", label: "double vente" },
            { value: "30 s", label: "pour un reçu PDF" },
            { value: "100 %", label: "mobile & français" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border bg-card p-6 text-center shadow-sm"
            >
              <p className="text-3xl font-bold text-primary">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingFeatures() {
  return (
    <section id="fonctionnalites" className="px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Le spécialiste de la vente échelonnée
          </h2>
          <p className="mt-4 text-muted-foreground">
            Pas un ERP généraliste — un outil métier pour lotisseurs et promoteurs ivoiriens.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingPricing() {
  return (
    <section id="tarifs" className="bg-muted/30 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold">Tarif simple, en FCFA</h2>
          <p className="mt-4 text-muted-foreground">
            Commencez gratuitement, payez quand vous êtes prêt.
          </p>
        </div>
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl border-2 border-primary bg-card p-8 shadow-lg">
            <p className="text-sm font-medium text-primary">Starter</p>
            <p className="mt-2">
              <span className="text-4xl font-bold">25 000</span>
              <span className="text-muted-foreground"> FCFA / mois</span>
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Biens & plans de masse illimités",
                "Clients, ventes & échéanciers",
                "Encaissements & relances",
                "Reçus & contrats PDF",
                "Multi-agents par organisation",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <Button className="mt-8 w-full" size="lg" asChild>
              <Link href="/register">Essai 14 jours — gratuit</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t px-4 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div>
          <p className="font-bold text-primary">TerraSwiftFlow</p>
          <p className="text-sm text-muted-foreground">
            Gestion immobilière — Côte d&apos;Ivoire
          </p>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link href="/setup" className="hover:text-foreground">
            Configuration locale
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Connexion
          </Link>
          <Link href="/register" className="hover:text-foreground">
            Inscription
          </Link>
        </div>
      </div>
    </footer>
  );
}
