<script setup>
import { onMounted } from "vue";
import { useSessionStore } from "../stores/session.store.js";

const session = useSessionStore();
onMounted(() => session.registerVisit());
</script>

<template>
  <section>
    <h1>Dashboard</h1>
    <p>Visits in this mount: <strong data-testid="visits">{{ session.visits }}</strong></p>
    <ul class="legacy-links">
      <li><RouterLink to="/legacy/reports">Reports</RouterLink></li>
      <li><RouterLink to="/legacy/reports/archive">Reports archive (old URL, redirects)</RouterLink></li>
      <li><RouterLink to="/settings">Settings (already migrated to React)</RouterLink></li>
    </ul>
    <button
      type="button"
      @click="session.openReports()"
    >
      Open weekly report from a store action
    </button>
  </section>
</template>
