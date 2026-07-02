/** Top-level tab routes — scroll resets only when navigating to these paths. */
export const TAB_ROOT_PATHS = [
  '/dashboard',
  '/log',
  '/scan',
  '/progress',
  '/settings',
] as const;

export type TabRootPath = (typeof TAB_ROOT_PATHS)[number];

export function isTabRootPathname(pathname: string): pathname is TabRootPath {
  return (TAB_ROOT_PATHS as readonly string[]).includes(pathname);
}
