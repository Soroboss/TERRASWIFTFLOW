import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth";
import {
  LandingFeatures,
  LandingFooter,
  LandingHeader,
  LandingHero,
  LandingPricing,
} from "@/components/landing/landing-sections";
import { SetupBanner } from "@/components/setup/setup-banner";

export default async function HomePage() {
  const session = await getSessionContext();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <SetupBanner />
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingPricing />
      </main>
      <LandingFooter />
    </div>
  );
}
