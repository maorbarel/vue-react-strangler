// @ts-check
// The legacy app still runs on its own (http://localhost:8080) through the same
// mount contract the shell uses. The contract is the app's only public surface.
import { mount } from "./federation/mount.js";

const currentPath = () => window.location.pathname + window.location.search + window.location.hash;

const element = document.getElementById("app");
if (!element) throw new Error("#app not found");

const controller = await mount(element, {
  initialPath: currentPath(),
  onNavigate(path, { replace }) {
    if (path === currentPath()) return;
    if (replace) window.history.replaceState(null, "", path);
    else window.history.pushState(null, "", path);
  },
});

window.addEventListener("popstate", () => controller.setPath(currentPath()));
