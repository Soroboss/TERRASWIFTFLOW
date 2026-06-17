import type { PropertyStatus } from "@/types/database";
import type { MasterplanLotGridItem } from "@/components/dashboard/masterplan-lots-grid";

export const DEMO_PROGRAM_NAME = "Programme Les Palmiers";

const demoStatuses: PropertyStatus[] = [
  ...Array<PropertyStatus>(12).fill("libre"),
  ...Array<PropertyStatus>(4).fill("reserve"),
  ...Array<PropertyStatus>(8).fill("vendu"),
];

export const DEMO_LOT_STATS = {
  libres: demoStatuses.filter((s) => s === "libre").length,
  reserves: demoStatuses.filter((s) => s === "reserve").length,
  vendus: demoStatuses.filter((s) => s === "vendu").length,
};

export const DEMO_COLLECTED_THIS_MONTH = 4_250_000;

export const DEMO_LOTS: MasterplanLotGridItem[] = demoStatuses.map((status, index) => ({
  id: `demo-lot-${index}`,
  lot_number: String(index + 1),
  status,
}));
