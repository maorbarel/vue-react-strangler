// @ts-check
/**
 * Module Federation entry: the only module the React shell ever imports.
 *
 * Every import is dynamic. With static imports, webpack hoists `vue`, `pinia`, etc.
 * into the container's initial chunks, and the container's startup (the line that
 * assigns the global the shell reads) can end up waiting for chunks the shell never
 * requests. Dynamic imports move all of that loading into `mount()` itself, where
 * webpack's chunk loader fetches it on demand from wherever remoteEntry.js came from.
 *
 * Each call creates a fresh app, router and store: no module-level state, so
 * mount → unmount → mount (React StrictMode does exactly that) is safe.
 *
 * @type {import("@strangler/contract").MountFn}
 */
export async function mount(element, { initialPath = "/", onNavigate } = {}) {
  const [{ createApp, markRaw }, { createPinia }, { createRouter, createMemoryHistory }, { default: App }, { routes }] =
    await Promise.all([
      import("vue"),
      import("pinia"),
      import("vue-router"),
      import("../App.vue"),
      import("../router/routes.js"),
    ]);
  await import("../styles/legacy.css");

  // Memory history: the shell owns the address bar. Two routers fighting over
  // window.history is how you get double entries and broken back buttons.
  const router = createRouter({ history: createMemoryHistory(), routes });

  const pinia = createPinia();
  pinia.use(({ store }) => {
    store.router = markRaw(router);
  });

  // Navigate before app.use(router): the router only fires its own initial
  // navigation to "/" when nothing has navigated yet, so this avoids a race
  // between that implicit push and ours.
  await router.push(initialPath);

  // A boot-time redirect ("/" → "/legacy/dashboard") happened before anyone was
  // listening. Report it explicitly, as a replace, so the shell URL is correct and
  // the back button does not bounce through the redirecting URL.
  const landedOn = router.currentRoute.value.fullPath;
  if (landedOn !== initialPath) {
    onNavigate?.(landedOn, { replace: true });
  }

  // Registered only now, so boot navigations never leak into the shell's history.
  router.afterEach((to, _from, failure) => {
    if (failure) return;
    onNavigate?.(to.fullPath, { replace: Boolean(to.redirectedFrom) });
  });

  const app = createApp(App);
  app.use(pinia);
  app.use(router);
  app.mount(element);

  return {
    async setPath(path) {
      if (router.currentRoute.value.fullPath === path) return;
      await router.push(path);
    },
    unmount() {
      app.unmount();
    },
  };
}
