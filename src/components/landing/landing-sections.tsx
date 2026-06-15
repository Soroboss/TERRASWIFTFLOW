import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  Map,
  MessageSquare,
  Shield,
  Smartphone,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRICING_PLANS, TRIAL_DAYS } from "@/lib/pricing";
import { PricingCard } from "@/components/landing/pricing-card";

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

const STEPS = [
  {
    step: "1",
    title: "Créez votre programme",
    description:
      "Importez votre plan de masse, définissez vos lots ou maisons VEFA et fixez les prix au m² en FCFA.",
  },
  {
    step: "2",
    title: "Enregistrez vos clients",
    description:
      "Fiche client, source (WhatsApp, terrain, salon…), échéancier personnalisé avec acompte et mensualités.",
  },
  {
    step: "3",
    title: "Encaissez et relancez",
    description:
      "Saisissez chaque paiement mobile money ou espèces. Les relances partent avant les échéances en retard.",
  },
  {
    step: "4",
    title: "Remettez les documents",
    description:
      "Reçu PDF en 30 secondes, contrat de vente prêt à imprimer. Votre client repart rassuré.",
  },
];

const USE_CASES = [
  {
    icon: Map,
    title: "Lotisseur à Abidjan",
    description:
      "Gérez 200 parcelles sur un seul plan de masse. Vos agents voient en temps réel ce qui est libre ou vendu.",
  },
  {
    icon: Building2,
    title: "Promoteur VEFA",
    description:
      "Maisons en construction, paiements échelonnés sur 24 mois. Suivez chaque encaissement lot par lot.",
  },
  {
    icon: Users,
    title: "Agence avec plusieurs agents",
    description:
      "Chaque commercial saisit ses ventes depuis le terrain. Le gérant a une vue consolidée sans appeler tout le monde.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Avant, on avait vendu le même lot deux fois. Aujourd'hui c'est impossible — le système bloque dès qu'un lot est réservé.",
    author: "M. Traoré",
    role: "Lotisseur, Bingerville",
  },
  {
    quote:
      "Mes agents sur le terrain encaissent Wave et génèrent le reçu sur place. Plus besoin de revenir au bureau le soir.",
    author: "Mme Koné",
    role: "Promotrice foncière, Cocody",
  },
  {
    quote:
      "En 14 jours d'essai on a migré 3 programmes. L'échéancier et les relances nous font gagner des heures chaque semaine.",
    author: "SARL Les Palmiers",
    role: "Promoteur, Yamoussoukro",
  },
];

const FAQ = [
  {
    q: "L'essai gratuit est-il vraiment sans engagement ?",
    a: `Oui. Vous disposez de ${TRIAL_DAYS} jours pour tester toutes les fonctionnalités du plan choisi, sans carte bancaire. À la fin de l'essai, vous activez l'abonnement ou votre accès est suspendu.`,
  },
  {
    q: "Quelle différence entre Starter et Pro ?",
    a: "Starter convient aux petites structures (jusqu'à 3 agents, 1 programme). Pro ajoute les agents illimités, plusieurs sites, le support prioritaire et l'export Excel.",
  },
  {
    q: "Comment payer après l'essai ?",
    a: "Paiement par Wave, Orange Money, MTN MoMo ou virement. Contactez-nous depuis le tableau de bord ou par e-mail pour activer votre abonnement.",
  },
  {
    q: "Puis-je changer de plan plus tard ?",
    a: "Oui. Passez de Starter à Pro à tout moment. La facturation s'ajuste au prorata du mois en cours.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Chaque organisation est isolée (multi-tenant). Vos données ne sont jamais partagées avec d'autres promoteurs.",
  },
];

const PAIN_POINTS = [
  "Deux agents vendent le même lot sans le savoir",
  "Échéanciers sur Excel, jamais à jour",
  "Reçus manuscrits perdus ou contestés",
  "Relances clients oubliées chaque mois",
  "Le gérant ne sait pas combien a été encaissé",
];

const SOLUTIONS = [
  "Blocage automatique anti-double-vente",
  "Échéancier lié à chaque vente en temps réel",
  "Reçus et contrats PDF en 30 secondes",
  "Relances planifiées avant retard",
  "Tableau de bord encaissements instantané",
];

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-primary">
          TerraSwiftFlow
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <a href="#probleme" className="text-muted-foreground hover:text-foreground">
            Pourquoi nous
          </a>
          <a href="#fonctionnalites" className="text-muted-foreground hover:text-foreground">
            Fonctionnalités
          </a>
          <a href="#comment" className="text-muted-foreground hover:text-foreground">
            Comment ça marche
          </a>
          <a href="#tarifs" className="text-muted-foreground hover:text-foreground">
            Tarifs
          </a>
          <a href="#faq" className="text-muted-foreground hover:text-foreground">
            FAQ
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
            en un seul outil pensé pour les promoteurs ivoiriens.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/register">
                Démarrer l&apos;essai — {TRIAL_DAYS} jours gratuits
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
              <Link href="#tarifs">Voir les offres</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Sans carte bancaire · 2 formules (Starter & Pro) · Configuration en 5 minutes
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-3">
          {[
            { value: "0", label: "double vente tolérée" },
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

export function LandingProblem() {
  return (
    <section id="probleme" className="border-y bg-muted/20 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Excel et WhatsApp ne suffisent plus
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            Quand vous vendez des terrains ou des maisons en paiement échelonné, une erreur
            coûte cher — en argent, en réputation et en contentieux.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-red-200/60 bg-red-50/50 p-8">
            <h3 className="flex items-center gap-2 font-semibold text-red-900">
              <XCircle className="h-5 w-5" />
              Sans TerraSwiftFlow
            </h3>
            <ul className="mt-6 space-y-4">
              {PAIN_POINTS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-red-900/80">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-8">
            <h3 className="flex items-center gap-2 font-semibold text-emerald-900">
              <CheckCircle2 className="h-5 w-5" />
              Avec TerraSwiftFlow
            </h3>
            <ul className="mt-6 space-y-4">
              {SOLUTIONS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-emerald-900/80">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
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

export function LandingHowItWorks() {
  return (
    <section id="comment" className="bg-muted/30 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Comment ça marche</h2>
          <p className="mt-4 text-muted-foreground">
            Opérationnel en une journée — pas besoin de consultant ni de formation longue.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ step, title, description }) => (
            <div key={step} className="relative">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {step}
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

export function LandingUseCases() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Conçu pour votre métier</h2>
          <p className="mt-4 text-muted-foreground">
            Lotisseurs, promoteurs VEFA et agences foncières en Côte d&apos;Ivoire.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {USE_CASES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-xl border bg-card p-6">
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

export function LandingTestimonials() {
  return (
    <section className="bg-muted/30 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Ils nous font confiance</h2>
          <p className="mt-4 text-muted-foreground">
            Des promoteurs ivoiriens qui ont quitté Excel pour TerraSwiftFlow.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map(({ quote, author, role }) => (
            <blockquote
              key={author}
              className="flex flex-col rounded-xl border bg-card p-6 shadow-sm"
            >
              <MessageSquare className="h-8 w-8 text-primary/40" />
              <p className="mt-4 flex-1 text-sm italic text-muted-foreground">
                &ldquo;{quote}&rdquo;
              </p>
              <footer className="mt-4 border-t pt-4">
                <p className="font-medium">{author}</p>
                <p className="text-xs text-muted-foreground">{role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingPricing() {
  return (
    <section id="tarifs" className="px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Deux formules, un essai gratuit</h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            Testez Starter ou Pro pendant {TRIAL_DAYS} jours sans carte bancaire.
            Choisissez la formule adaptée à la taille de votre activité.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {PRICING_PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Besoin de plus ?{" "}
          <a href="mailto:contact@terraswiftflow.ci" className="text-primary hover:underline">
            Contactez-nous
          </a>{" "}
          pour un devis Business (multi-organisations, API, formation sur site).
        </p>
      </div>
    </section>
  );
}

export function LandingFAQ() {
  return (
    <section id="faq" className="bg-muted/30 px-4 py-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Questions fréquentes</h2>
        </div>
        <div className="space-y-4">
          {FAQ.map(({ q, a }) => (
            <details
              key={q}
              className="group rounded-xl border bg-card p-6 shadow-sm open:shadow-md"
            >
              <summary className="cursor-pointer list-none font-medium marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {q}
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                </span>
              </summary>
              <p className="mt-4 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingCTA() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-4xl rounded-2xl bg-primary px-8 py-12 text-center text-primary-foreground sm:px-12">
        <h2 className="text-3xl font-bold sm:text-4xl">
          Prêt à sécuriser vos ventes ?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-primary-foreground/90">
          Rejoignez les promoteurs qui ont abandonné Excel. {TRIAL_DAYS} jours gratuits,
          sans carte — annulez à tout moment pendant l&apos;essai.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" variant="secondary" asChild>
            <Link href="/register?plan=starter">Essai Starter gratuit</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            asChild
          >
            <Link href="/register?plan=pro">Essai Pro gratuit</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-8 sm:flex-row sm:items-start">
          <div>
            <p className="font-bold text-primary">TerraSwiftFlow</p>
            <p className="text-sm text-muted-foreground">
              Gestion immobilière — Côte d&apos;Ivoire
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Vente échelonnée · Terrains & VEFA · FCFA
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-muted-foreground sm:grid-cols-3">
            <a href="#fonctionnalites" className="hover:text-foreground">
              Fonctionnalités
            </a>
            <a href="#tarifs" className="hover:text-foreground">
              Tarifs
            </a>
            <a href="#faq" className="hover:text-foreground">
              FAQ
            </a>
            <Link href="/setup" className="hover:text-foreground">
              Configuration
            </Link>
            <Link href="/login" className="hover:text-foreground">
              Connexion
            </Link>
            <Link href="/register" className="hover:text-foreground">
              Inscription
            </Link>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} TerraSwiftFlow — Tous droits réservés
        </p>
      </div>
    </footer>
  );
}
