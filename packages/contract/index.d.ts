/**
 * The contract between the React shell (host) and the legacy Vue app (remote).
 *
 * This is the only thing the two apps share. Keep it tiny: every field
 * added here is a field both teams have to keep stable until the last legacy
 * page is gone.
 */

export interface NavigateOptions {
  /** True when the legacy router landed on this path via a redirect. */
  replace: boolean;
}

export interface MountOptions {
  /** The shell's current URL (pathname + search + hash) at mount time. */
  initialPath?: string;
  /** Called after every completed legacy navigation, so the shell can own the URL. */
  onNavigate?: (path: string, options: NavigateOptions) => void;
}

export interface LegacyAppController {
  /** Drive the legacy router from the shell. A no-op when already on `path`. */
  setPath(path: string): Promise<void>;
  /** Tear down the Vue app and release everything it holds. */
  unmount(): void;
}

export type MountFn = (element: HTMLElement, options?: MountOptions) => Promise<LegacyAppController>;

export interface MountModule {
  mount: MountFn;
}

/** The shape webpack 5 assigns to the remote's global (`library: { type: "var" }`). */
export interface WebpackRemoteContainer {
  init(shareScope: Record<string, unknown>): Promise<void> | void;
  get(module: string): Promise<() => unknown>;
}
