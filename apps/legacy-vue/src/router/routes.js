// @ts-check
/** @type {import("vue-router").RouteRecordRaw[]} */
export const routes = [
  // Boot redirect: the shell mounts us on "/" and we decide where that goes.
  { path: "/", redirect: "/legacy/dashboard" },
  { path: "/legacy", redirect: "/legacy/dashboard" },
  { path: "/legacy/dashboard", component: () => import("../pages/DashboardPage.vue") },
  { path: "/legacy/reports", component: () => import("../pages/ReportsPage.vue") },
  // An old URL kept alive by a redirect, the way real legacy apps accumulate them.
  { path: "/legacy/reports/archive", redirect: { path: "/legacy/reports", query: { range: "year" } } },
  { path: "/:pathMatch(.*)*", component: () => import("../pages/NotFoundPage.vue") },
];
