import { Suspense } from "react";
import { Route, Routes } from "react-router";
import { Layout } from "./components/Layout";
import { VueLegacyRoute } from "./components/VueLegacyRoute";
import { MIGRATED_PAGES } from "./pages";
import { MIGRATED_ROUTES } from "./migration/routes-map";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {MIGRATED_ROUTES.map((prefix) => {
          const Page = MIGRATED_PAGES[prefix];
          return (
            <Route
              key={prefix}
              path={`${prefix}/*`}
              element={
                <Suspense fallback={<p className="shell-status">Loading…</p>}>
                  <Page />
                </Suspense>
              }
            />
          );
        })}
        {/* Everything not migrated yet. One element for all legacy paths, so React
            keeps the Vue app mounted while the user moves between legacy pages. */}
        <Route path="*" element={<VueLegacyRoute />} />
      </Route>
    </Routes>
  );
}
