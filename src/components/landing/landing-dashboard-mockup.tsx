import { DashboardOverviewPanel } from "@/components/dashboard/dashboard-overview-panel";
import {
  DEMO_COLLECTED_THIS_MONTH,
  DEMO_LOTS,
  DEMO_LOT_STATS,
  DEMO_PROGRAM_NAME,
} from "@/lib/dashboard-demo";

export function LandingDashboardMockup() {
  return (
    <DashboardOverviewPanel
      organizationName="TerraSwiftFlow"
      programName={DEMO_PROGRAM_NAME}
      trialDaysLeft={12}
      libres={DEMO_LOT_STATS.libres}
      reserves={DEMO_LOT_STATS.reserves}
      vendus={DEMO_LOT_STATS.vendus}
      lots={DEMO_LOTS}
      totalLots={DEMO_LOTS.length}
      collectedThisMonth={DEMO_COLLECTED_THIS_MONTH}
      shadow="lg"
    />
  );
}
