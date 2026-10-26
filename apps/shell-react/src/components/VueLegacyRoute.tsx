import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import type { LegacyAppController } from "@strangler/contract";
import { loadLegacyApp } from "../lib/legacy-remote";
import { planShellNavigation, toLegacyPath } from "../migration/url-sync";

/**
 * Hosts the legacy Vue app for every path that is not migrated yet.
 *
 * Mounted once and kept alive while the user moves between legacy pages; route
 * changes are forwarded with setPath instead of remounting. Unmounted when the
 * user leaves for a React page.
 */
export function VueLegacyRoute() {
  const hostRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<LegacyAppController | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  const shellPath = toLegacyPath(location);

  // Callbacks registered with the Vue app outlive this render; read fresh values through refs.
  const shellPathRef = useRef(shellPath);
  const navigateRef = useRef(navigate);
  useLayoutEffect(() => {
    shellPathRef.current = shellPath;
    navigateRef.current = navigate;
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // Each mount gets its own element. Under StrictMode (and fast route flips) a
    // previous mount may still be resolving when the next one starts; Vue's unmount
    // clears whatever app is attached to its container, so sharing one would let
    // the stale instance wipe the live one.
    const mountPoint = document.createElement("div");
    host.appendChild(mountPoint);

    let cancelled = false;
    let controller: LegacyAppController | null = null;

    (async () => {
      try {
        const { mount } = await loadLegacyApp();
        if (cancelled) return;

        const mounted = await mount(mountPoint, {
          initialPath: shellPathRef.current,
          onNavigate: (path, options) => {
            const plan = planShellNavigation(path, shellPathRef.current, options);
            if (plan) navigateRef.current(plan.to, { replace: plan.replace });
          },
        });

        if (cancelled) {
          mounted.unmount();
          return;
        }
        controller = controllerRef.current = mounted;
        // The URL may have moved while the remote was loading.
        await mounted.setPath(shellPathRef.current);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      }
    })();

    return () => {
      cancelled = true;
      controller?.unmount();
      if (controllerRef.current === controller) controllerRef.current = null;
      mountPoint.remove();
    };
  }, [attempt]);

  useEffect(() => {
    void controllerRef.current?.setPath(shellPath);
  }, [shellPath]);

  if (error) {
    return (
      <div className="shell-error" role="alert">
        <p>The legacy app failed to load.</p>
        <pre>{error.message}</pre>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setAttempt((n) => n + 1);
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return <div ref={hostRef} className="legacy-host" data-testid="legacy-host" />;
}
