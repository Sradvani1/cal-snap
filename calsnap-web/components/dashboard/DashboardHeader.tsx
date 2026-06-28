interface DashboardHeaderProps {
  greeting: string;
  date: string;
}

export function DashboardHeader({ greeting, date }: DashboardHeaderProps) {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-semibold text-neutral-900">{greeting}</h1>
      <p className="text-sm text-neutral-500">{date}</p>
    </header>
  );
}

export function DashboardHeaderSkeleton() {
  return (
    <header className="space-y-2">
      <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
      <div className="h-4 w-56 animate-pulse rounded bg-neutral-100" />
    </header>
  );
}
