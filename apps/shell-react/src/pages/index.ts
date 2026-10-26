import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { MigratedRoute } from "../migration/routes-map";

/** One page per migrated prefix. The Record type makes a missing page a compile error. */
export const MIGRATED_PAGES: Record<MigratedRoute, LazyExoticComponent<ComponentType>> = {
  "/settings": lazy(() => import("./SettingsPage")),
  "/profile": lazy(() => import("./ProfilePage")),
};
