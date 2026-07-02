import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { copy } from '@/lib/copy';
import { layout } from '@/lib/design/layout';
import { cn } from '@/lib/utils/cn';

interface ScanFabProps {
  href: string;
}

export function ScanFab({ href }: ScanFabProps) {
  return (
    <Button
      asChild
      className={cn(
        'fixed right-4 z-20 h-14 min-w-14 rounded-full px-5',
        layout.elevation.fab,
        layout.fixed.aboveTabBar,
      )}
    >
      <Link href={href} aria-label={copy('dashboard.scanFab.label')}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5"
          aria-hidden
        >
          <path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3" />
          <rect x="7" y="7" width="10" height="10" rx="1" />
        </svg>
        {copy('dashboard.scanFab.button')}
      </Link>
    </Button>
  );
}
