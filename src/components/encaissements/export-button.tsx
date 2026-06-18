import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EncaissementsExportButton() {
  return (
    <Button variant="outline" size="sm" asChild className="gap-2">
      <Link href="/api/export/encaissements" download>
        <Download className="h-4 w-4" />
        Export Excel (CSV)
      </Link>
    </Button>
  );
}
