/**
 * Pure rules for keeping two routers on one URL.
 *
 * The shell's router is the source of truth for the address bar. The legacy
 * router runs on memory history and is driven by the shell (setPath); it reports
 * back through onNavigate. Both directions are guarded by equality so a change
 * that originated on one side is never echoed back, which is what prevents loops.
 */

export interface LocationLike {
  pathname: string;
  search: string;
  hash: string;
}

export interface ShellNavigation {
  to: string;
  replace: boolean;
}

/**
 * The path handed to the legacy router. Includes search and hash: legacy pages
 * read `route.query`, and dropping it renders them empty.
 */
export function toLegacyPath({ pathname, search, hash }: LocationLike): string {
  return `${pathname || "/"}${search}${hash}`;
}

/**
 * What the shell should do when the legacy app reports a navigation.
 * Returns null when the shell is already there (the report is an echo of setPath).
 */
export function planShellNavigation(
  legacyPath: string,
  shellPath: string,
  { replace }: { replace: boolean },
): ShellNavigation | null {
  if (legacyPath === shellPath) return null;
  return { to: legacyPath, replace };
}
