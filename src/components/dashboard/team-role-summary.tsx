interface TeamRoleSummaryProps {
  owners: number;
  managers: number;
  agents: number;
}

export function TeamRoleSummary({ owners, managers, agents }: TeamRoleSummaryProps) {
  const items = [
    { label: "Propriétaires", value: owners, dot: "bg-primary" },
    { label: "Managers", value: managers, dot: "bg-violet-500" },
    { label: "Agents", value: agents, dot: "bg-blue-500" },
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
