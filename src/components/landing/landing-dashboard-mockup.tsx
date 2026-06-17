export function LandingDashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-lg rounded-2xl border bg-background p-4 shadow-2xl shadow-primary/10">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-primary">TerraSwiftFlow</p>
          <p className="text-[10px] text-muted-foreground">Programme Les Palmiers</p>
        </div>
        <div className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
          12 j. essai
        </div>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        {[
          { label: "Libres", value: "47", color: "bg-emerald-500" },
          { label: "Réservés", value: "8", color: "bg-amber-500" },
          { label: "Vendus", value: "35", color: "bg-red-500" },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border bg-muted/30 p-2 text-center">
            <div className={`mx-auto mb-1 h-2 w-2 rounded-full ${item.color}`} />
            <p className="text-sm font-bold">{item.value}</p>
            <p className="text-[9px] text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-muted/20 p-2">
        <p className="mb-2 text-[10px] font-medium text-muted-foreground">Plan de masse</p>
        <div className="grid grid-cols-6 gap-1">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-sm ${
                i % 7 === 0
                  ? "bg-red-400/80"
                  : i % 5 === 0
                    ? "bg-amber-400/80"
                    : "bg-emerald-400/80"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/80 p-2">
        <p className="text-[10px] text-emerald-900">
          Encaissé ce mois : <span className="font-bold">4 250 000 FCFA</span>
        </p>
      </div>
    </div>
  );
}
