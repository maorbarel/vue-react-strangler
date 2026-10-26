// Copy the legacy remote's build under the shell's dist, so one static host serves both:
//   apps/shell-react/dist/                         ← the shell
//   apps/shell-react/dist/remotes/legacy-vue/      ← remoteEntry.js + its chunks
import { copyFileSync, cpSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const legacyDist = fileURLToPath(new URL("../apps/legacy-vue/dist/", import.meta.url));
const target = fileURLToPath(new URL("../apps/shell-react/dist/remotes/legacy-vue/", import.meta.url));

for (const dir of [legacyDist, fileURLToPath(new URL("../apps/shell-react/dist/", import.meta.url))]) {
  if (!existsSync(dir)) {
    console.error(`✗ ${dir} is missing. Build both apps first.`);
    process.exit(1);
  }
}

rmSync(target, { recursive: true, force: true });
// The legacy app's standalone index.html is not needed inside the shell.
cpSync(legacyDist, target, { recursive: true, filter: (src) => !src.endsWith("index.html") });
console.log(`✓ legacy remote copied to ${target}`);

// Static hosts without rewrites (GitHub Pages) serve 404.html for unknown paths; making it the
// shell lets deep links like /legacy/reports boot the app instead of a host error page.
const shellDist = fileURLToPath(new URL("../apps/shell-react/dist/", import.meta.url));
copyFileSync(`${shellDist}index.html`, `${shellDist}404.html`);
console.log("✓ 404.html written for static-host deep links");
