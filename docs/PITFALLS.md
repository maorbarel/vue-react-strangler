# Pitfalls: mounting a legacy Vue app inside a React shell

These are the problems that cost real debugging time when we ran this setup on a production app,
with a webpack-built Vue app as the remote and a Vite-built React shell as the host. Each one
compiled fine, passed unit tests, and failed only in the browser, usually silently.

Each section has the symptom, the root cause, and the fix as it appears in this repo.

---

## 1. The remote's global is `undefined`, but only in dev

**Symptom.** `remoteEntry.js` loads with status 200, no console errors, yet
`window.legacyVueApp` is `undefined`. Production builds work.

**Root cause.** A webpack container entry ends with a startup function that assigns the global
(`var legacyVueApp = __webpack_require__(...)`). If the entry depends on another *initial* chunk,
the startup is deferred until that chunk is registered.

`webpack-dev-server` injects its HMR client into **every** entry, including the container entry.
With a typical `splitChunks: { chunks: "all" }`, that client lands in a shared `vendor.js`. The
legacy app's own `index.html` loads `vendor.js`, so the standalone app is fine. The shell only
loads `remoteEntry.js`, so the deferred startup never runs and the global is never assigned. No
error is thrown, because nothing failed. It is just still waiting.

**Fix.** Two layers, both in this repo:

- Remove the cause: `optimization: { runtimeChunk: false, splitChunks: { chunks: "async" } }`
  in [`webpack.config.js`](../apps/legacy-vue/webpack.config.js). The container entry then has
  no synchronous chunk dependencies.
- Be defensive in dev anyway: the loader in
  [`remote-loader.ts`](../apps/shell-react/src/lib/remote-loader.ts) can preload `vendor.js` before
  `remoteEntry.js` (`preloadChunk`), ignoring a 404. If the global is still missing, it throws an
  error that names both likely causes instead of failing later with `cannot read 'init' of undefined`.

Related: make every import inside the exposed `mount()` dynamic. Static imports in the exposed
module pull `vue`, `vue-router` and friends into the container's initial chunk graph, which is
exactly the kind of dependency that defers startup.

## 2. Plugins installed, but the app can't see them

**Symptom.** You install a UI framework's plugin (notifications, dialogs, a loading bar) in
`mount()`, and components that use it crash or render nothing, as if it was never installed.

**Root cause.** Two module instances. Many UI libraries publish both a prebuilt dist bundle and
their source modules. Your components import the library through whatever your build resolves
(often source, via a babel or webpack transform that rewrites imports for tree-shaking). A dynamic
`import("the-library")` in `mount()` goes through the package's `main` or `exports` field and
resolves to the **prebuilt dist file**, a separate copy with its own internal state. You installed
the plugin on copy A; your components talk to copy B.

**Fix.** In `mount()`, import from the *same paths* your components resolve to. If an import
transform rewrites `import { X } from "lib"` to `lib/src/x.js`, dynamically import `lib/src/x.js`,
not `lib`. When in doubt, log `import.meta.url` (or compare object identity) from both sides.
This demo uses plain Vue, vue-router and Pinia, which resolve to one instance, so the rule is
applied implicitly. With a component framework it has to be done by hand.

## 3. The legacy app's CSS reset breaks the shell

**Symptom.** Navigating to a Vue page changes the React header: margins vanish, buttons and
links restyle. It is worse after a full refresh on a legacy URL than after client-side navigation,
because the injection order differs.

**Root cause.** The legacy app ships a global reset (`* { margin: 0 }`, `button { ... }`) and
injects it into `<head>` at runtime. Plain CSS has no isolation, so whichever rule wins on
specificity and source order wins, and source order depends on when the legacy app was loaded.

**Fix.** [Cascade layers](https://developer.mozilla.org/docs/Web/CSS/@layer). The shell declares
the order first, in [`index.css`](../apps/shell-react/src/styles/index.css):

```css
@layer legacy, shell;
```

and everything the legacy app ships is wrapped in `@layer legacy { ... }`
([`legacy.css`](../apps/legacy-vue/src/styles/legacy.css)). A layer declared earlier always loses
to one declared later, regardless of specificity or `<style>` tag order, so the shell wins
deterministically. Utility CSS frameworks that emit their own reset should be imported into a layer
too (for example, Tailwind's preflight via `@import "tailwindcss/preflight.css" layer(base)`).

Know the limits: the legacy reset still applies to shell elements the shell does not style, and
style tags injected by the remote stay in `<head>` after unmount. Layers make the conflict
predictable; they do not make the two apps independent. Shadow DOM would, at the cost of breaking
portals, dialogs and global styles inside the legacy app.

## 4. Boot redirects leak into the shell's history

**Symptom.** The user opens `/`. The legacy router redirects to `/legacy/dashboard`. Pressing
Back goes to `/`, which redirects forward again: the user is stuck.

**Root cause.** The URL-sync listener (`router.afterEach`) was registered before the initial
navigation, so the redirect was reported as an ordinary navigation and the shell pushed it.

**Fix.** In [`mount.js`](../apps/legacy-vue/src/federation/mount.js):

1. Resolve `initialPath` **before** registering `afterEach`.
2. If the landing path differs, report it once with `{ replace: true }`.
3. Register `afterEach` only then, and report later redirects as replaces too
   (`replace: Boolean(to.redirectedFrom)`).

Also push `initialPath` before `app.use(router)`. Installing the router triggers its own initial
navigation to `/` when nothing has navigated yet, and that implicit push would race the explicit one.

## 5. Two routers, one history

**Symptom.** Double history entries, Back needing two presses, or an infinite loop between the
routers after a redirect.

**Root cause.** Both routers were writing to `window.history`, or each echoed the other's
navigation back.

**Fix.** Exactly one owner. The shell uses `BrowserRouter`; the legacy app uses
`createMemoryHistory()` and never touches the address bar. Sync is two guarded, one-directional
calls ([`url-sync.ts`](../apps/shell-react/src/migration/url-sync.ts)):

- shell → legacy: `setPath(path)`, a no-op if the legacy router is already there;
- legacy → shell: `onNavigate(path)`, ignored if the shell is already there.

Each guard turns the echo of the other direction into a no-op, so loops are impossible by
construction rather than by timing. Two smaller details mattered:

- Pass `pathname + search + hash`, not just `pathname`. Legacy pages read `route.query` and render
  empty without it.
- Mount the legacy app **once** for all legacy routes (a single catch-all route element), and
  forward route changes with `setPath`. Remounting per route throws away state and costs a full app
  boot on every click.

React specifics in [`VueLegacyRoute.tsx`](../apps/shell-react/src/components/VueLegacyRoute.tsx):
under `StrictMode` the effect runs mount → cleanup → mount, and the first async `mount()` can
resolve after its cleanup ran. The component unmounts such late arrivals immediately and gives
every mount its own child element. Vue's `unmount()` clears whatever app is attached to the
container, so a shared container would let the stale instance wipe the live one.

## 6. Production: `Unexpected token '<'` from a file that doesn't exist

**Symptom.** In production, the console shows `Uncaught SyntaxError: Unexpected token '<'` when
the legacy app loads, and sometimes the remote fails entirely.

**Root cause.** The dev-only `vendor.js` preload from pitfall #1 was also running in production,
where the file does not exist. The CDN or static host is configured as an SPA: unknown paths
return `index.html` **with status 200**. A `<script>` tag treats 200 as success, so `onload` fires
and `onerror` does not, and the browser tries to execute HTML as JavaScript. The same thing
happens to `remoteEntry.js` itself if its URL is wrong.

**Fix.**

- Preload `vendor.js` only when `import.meta.env.DEV` is true
  ([`legacy-remote.ts`](../apps/shell-react/src/lib/legacy-remote.ts)).
- Never trust `onload` alone: after loading, check that the container global exists and fail
  with a message that mentions the HTML-fallback possibility.
- Resolve the remote URL from the app's base path (`import.meta.env.BASE_URL`), not relative to
  `document.baseURI`. With browser history, the base URI on `/legacy/reports` is `/legacy/`, so a
  relative `remotes/...` URL silently points to the wrong place, and the SPA fallback hides the 404.
- Serve `remoteEntry.js` with `Cache-Control: no-cache`. It is the one file with a stable name; the
  chunks it references are content-hashed and can be cached forever.

---

### The general lesson

Every bug above came from **implicit shared state**: a global assigned at an unknown time, a
module instance resolved two ways, a cascade with no explicit order, a history with two writers.
The fixes all make one thing explicit: an owner, an order, or a contract. The whole integration
surface in this repo is one types file and three functions.
