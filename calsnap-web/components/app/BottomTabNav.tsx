'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUnsavedWork } from '@/lib/scanner/unsaved-work-context';

const TABS = [
  { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { href: '/log', label: 'Log', icon: LogIcon },
  { href: '/scan', label: 'Scan', icon: ScanIcon },
  { href: '/progress', label: 'Progress', icon: ProgressIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
] as const;

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`h-6 w-6 ${active ? 'text-neutral-900' : 'text-neutral-400'}`}
      aria-hidden
    >
      <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function LogIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`h-6 w-6 ${active ? 'text-neutral-900' : 'text-neutral-400'}`}
      aria-hidden
    >
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function ScanIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`h-6 w-6 ${active ? 'text-neutral-900' : 'text-neutral-400'}`}
      aria-hidden
    >
      <path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3" />
      <rect x="7" y="7" width="10" height="10" rx="1" />
    </svg>
  );
}

function ProgressIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`h-6 w-6 ${active ? 'text-neutral-900' : 'text-neutral-400'}`}
      aria-hidden
    >
      <path d="M3 3v18h18" />
      <path d="m7 14 4-4 3 3 5-6" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`h-6 w-6 ${active ? 'text-neutral-900' : 'text-neutral-400'}`}
      aria-hidden
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function TabLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof DashboardIcon;
  active: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { requestNavigation } = useUnsavedWork();

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
      className="flex min-h-11 flex-col items-center justify-center gap-1 px-1 py-2 text-xs font-medium"
    >
      <Icon active={active} />
      <span className={active ? 'text-neutral-900' : 'text-neutral-400'}>{label}</span>
    </Link>
  );
}

export function BottomTabNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 border-t border-neutral-200 bg-white"
      aria-label="Main"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <TabLink href={href} label={label} icon={Icon} active={active} />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
