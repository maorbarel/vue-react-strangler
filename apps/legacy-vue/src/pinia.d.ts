import type { Router } from "vue-router";

declare module "pinia" {
  export interface PiniaCustomProperties {
    /** Injected per app instance by mount(); stores never import a router singleton. */
    router: Router;
  }
}
