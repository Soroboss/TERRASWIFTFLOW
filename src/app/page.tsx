import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth";
import {
  LandingCompetitive,
  LandingCTA,
  LandingFAQ,
  LandingFeatures,
  LandingFooter,
  LandingHeader,
  LandingHero,
  LandingHowItWorks,
  LandingPricing,
  LandingProblem,
  LandingTestimonials,
  LandingUseCases,
} from "@/components/landing/landing-sections";
import { SetupBanner } from "@/components/setup/setup-banner";

export default async function HomePage() {
  const session = await getSessionContext();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <SetupBanner />
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingProblem />
        <LandingFeatures />
        <LandingCompetitive />
        <LandingHowItWorks />
        <LandingUseCases />
        <LandingTestimonials />
        <LandingPricing />
        <LandingFAQ />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
