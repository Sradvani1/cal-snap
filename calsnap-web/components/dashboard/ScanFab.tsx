import Link from 'next/link';

interface ScanFabProps {
  href: string;
}

export function ScanFab({ href }: ScanFabProps) {
  return (
    <Link
      href={href}
      className="fixed bottom-20 right-4 z-20 flex h-14 min-w-14 items-center justify-center gap-2 rounded-full bg-neutral-900 px-5 text-sm font-semibold text-white shadow-lg transition hover:bg-neutral-800"
      aria-label="Scan meal"
    >
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
      Scan
    </Link>
  );
}
