'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChartLine, House, List, ScanLine, Settings } from 'lucide-react';
import { copy, type CopyKey } from '@/lib/copy';
import { formFieldFocusRingClassName } from '@/lib/design/form-field';
import { layout } from '@/lib/design/layout';
import { cn } from '@/lib/utils/cn';
import { useUnsavedWork } from '@/lib/scanner/unsaved-work-context';

const TABS = [
  { href: '/dashboard', labelKey: 'common.nav.dashboard' as CopyKey, icon: House },
  { href: '/log', labelKey: 'common.nav.log' as CopyKey, icon: List },
  { href: '/scan', labelKey: 'common.nav.scan' as CopyKey, icon: ScanLine },
  { href: '/progress', labelKey: 'common.nav.progress' as CopyKey, icon: ChartLine },
  { href: '/settings', labelKey: 'common.nav.settings' as CopyKey, icon: Settings },
] as const;

function iconClass(active: boolean): string {
  return cn('h-6 w-6', active ? 'text-cs-foreground' : 'text-cs-muted');
}

function TabLink({
  href,
  labelKey,
  icon: Icon,
  active,
}: {
  href: string;
  labelKey: CopyKey;
  icon: (typeof TABS)[number]['icon'];
  active: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { requestNavigation } = useUnsavedWork();
  const label = copy(labelKey);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === href || pathname.startsWith(`${href}/`)) {
      return;
    }
    if (!requestNavigation(href)) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    router.push(href);
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-11 flex-col items-center justify-center gap-1 px-1 py-2 text-xs font-medium',
        formFieldFocusRingClassName,
      )}
    >
      <Icon className={iconClass(active)} aria-hidden />
      <span className={active ? 'text-cs-primary' : 'text-cs-muted'}>{label}</span>
    </Link>
  );
}

export function BottomTabNav() {
  const pathname = usePathname();

  return (
    <nav className={layout.tabBar.nav} aria-label={copy('common.nav.main')}>
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {TABS.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <TabLink
                href={href}
                labelKey={labelKey}
                icon={Icon}
                active={active}
              />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
