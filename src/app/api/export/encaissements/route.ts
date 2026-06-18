import { NextResponse } from "next/server";
import {
  buildEncaissementsCsv,
  canExportEncaissements,
  getExportAgentScope,
} from "@/lib/export/encaissements-csv";
import { format } from "date-fns";

export async function GET() {
  try {
    const allowed = await canExportEncaissements();
    if (!allowed) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const agentId = await getExportAgentScope();
    const csv = await buildEncaissementsCsv(agentId);
    const filename = `encaissements-${format(new Date(), "yyyy-MM-dd")}.csv`;

    return new NextResponse("\uFEFF" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Export impossible" }, { status: 500 });
  }
}
