// @ts-check
import { defineStore } from "pinia";

export const useSessionStore = defineStore("session", {
  state: () => ({ visits: 0 }),
  actions: {
    registerVisit() {
      this.visits += 1;
    },
    openReports() {
      // `this.router` is injected per app instance by mount(), not imported.
      return this.router.push({ path: "/legacy/reports", query: { range: "week" } });
    },
  },
});
