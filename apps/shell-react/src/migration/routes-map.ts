/**
 * The single switch of the migration.
 *
 * A path prefix listed here is rendered by React; anything else goes to the
 * legacy Vue app. Migrating a page = adding its prefix (plus a component in
 * src/pages). Rolling back = deleting the line. Nothing else changes.
 *
 * Convention: leading slash, no trailing slash.
 */
export const MIGRATED_ROUTES = ["/settings", "/profile"] as const;

export type MigratedRoute = (typeof MIGRATED_ROUTES)[number];

/** Strip query, hash and trailing slashes so "/settings/?tab=a#x" matches "/settings". */
export function toPathname(path: string): string {
  const pathname = path.split(/[?#]/, 1)[0].replace(/\/+$/, "");
  return pathname === "" ? "/" : pathname;
}

/** True when `path` (or any sub-path of it) is owned by React. */
export function isMigrated(path: string, routes: readonly string[] = MIGRATED_ROUTES): boolean {
  const pathname = toPathname(path);
  return routes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
