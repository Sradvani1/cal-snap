import { typography } from '@/lib/design/typography';

interface DashboardHeaderProps {
  greeting: string;
  date: string;
}

export function DashboardHeader({ greeting, date }: DashboardHeaderProps) {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-semibold text-cs-foreground">{greeting}</h1>
      <p className={typography.csCaption}>{date}</p>
    </header>
  );
}

export function DashboardHeaderSkeleton() {
  return (
    <header className="space-y-2">
      <div className="h-8 w-48 animate-pulse rounded bg-cs-muted/20" />
      <div className="h-4 w-56 animate-pulse rounded bg-cs-muted/20" />
    </header>
  );
}
