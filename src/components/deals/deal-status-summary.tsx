interface DealStatusSummaryProps {
  en_cours: number;
  solde: number;
  annule: number;
}

export function DealStatusSummary({ en_cours, solde, annule }: DealStatusSummaryProps) {
  const items = [
    { label: "En cours", value: en_cours, dot: "bg-amber-500" },
    { label: "Soldées", value: solde, dot: "bg-emerald-500" },
    { label: "Annulées", value: annule, dot: "bg-muted-foreground" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border bg-muted/30 p-2 text-center sm:p-3">
          <div className={`mx-auto mb-1 h-2 w-2 rounded-full ${item.dot}`} />
          <p className="text-lg font-bold sm:text-xl">{item.value}</p>
          <p className="text-[10px] text-muted-foreground sm:text-xs">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
