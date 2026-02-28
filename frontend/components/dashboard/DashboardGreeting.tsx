function getHour(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

interface DashboardGreetingProps {
  interviewCount: number;
}

export function DashboardGreeting({ interviewCount }: DashboardGreetingProps) {
  return (
    <div>
      <h1 className="text-3xl font-light tracking-tight text-foreground">
        {getHour()}, there.
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        You have {interviewCount} active interview
        {interviewCount !== 1 ? "s" : ""} this week.
      </p>
    </div>
  );
}
