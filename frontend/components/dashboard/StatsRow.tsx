interface StatsRowProps {
  total: number;
  applied: number;
  interviews: number;
  offers: number;
}

export function StatsRow({ total, applied, interviews, offers }: StatsRowProps) {
  const stats = [
    { label: "Total Applications", value: total },
    { label: "Applied", value: applied },
    { label: "Interviews", value: interviews },
    { label: "Offers", value: offers },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="border border-border rounded p-4">
          <p className="text-2xl font-semibold text-foreground">{s.value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
