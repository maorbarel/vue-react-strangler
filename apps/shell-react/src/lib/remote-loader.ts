import type { WebpackRemoteContainer } from "@strangler/contract";

export interface RemoteConfig {
  /** Absolute URL of the container entry (remoteEntry.js). */
  url: string;
  /** Global the container assigns itself to (`library: { type: "var", name }`). */
  globalName: string;
  /** Exposed module to load, e.g. "./mount". */
  module: string;
  /**
   * Dev only: a chunk the container entry may depend on (webpack-dev-server puts
   * its client in a vendor chunk). Loaded first so the container's startup can run.
   * Never set this in production: see docs/PITFALLS.md #6.
   */
  preloadChunk?: string;
}

export type ScriptLoader = (src: string) => Promise<void>;

/** Append a <script> once per URL and resolve when it has executed. */
export const loadScript: ScriptLoader = (src) =>
  new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });

/**
 * Create a memoized loader for one exposed module of a webpack remote.
 * The first call does the work; later calls share the same promise. A failed
 * load is forgotten, so the next call retries instead of failing forever.
 */
export function createRemoteLoader<T>(
  config: RemoteConfig,
  { load = loadScript, scope = globalThis as unknown as Record<string, unknown> } = {},
): () => Promise<T> {
  let pending: Promise<T> | null = null;

  const fetchModule = async (): Promise<T> => {
    if (config.preloadChunk) {
      // Absent in most setups; a 404 here is expected and harmless.
      await load(config.preloadChunk).catch(() => undefined);
    }
    await load(config.url);

    const container = scope[config.globalName] as WebpackRemoteContainer | undefined;
    if (!container) {
      throw new Error(
        `Remote "${config.globalName}" not found after loading ${config.url}. ` +
          "Either its startup was deferred waiting for a chunk, or the server answered with " +
          "an HTML fallback page instead of JavaScript.",
      );
    }

    // No shared modules: the shell has no Vue, so the share scope stays empty.
    // It must still be initialized once before get().
    await container.init({});
    const factory = await container.get(config.module);
    return factory() as T;
  };

  return () => {
    pending ??= fetchModule().catch((error: unknown) => {
      pending = null;
      throw error;
    });
    return pending;
  };
}
