<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const range = computed(() => route.query.range ?? "all");
</script>

<template>
  <section>
    <h1>Reports</h1>
    <p>Range from the query string: <strong data-testid="range">{{ range }}</strong></p>
    <nav class="legacy-links">
      <RouterLink to="/legacy/reports?range=week">Week</RouterLink>
      <RouterLink to="/legacy/reports?range=month">Month</RouterLink>
      <RouterLink to="/legacy/dashboard">Back to dashboard</RouterLink>
    </nav>
  </section>
</template>
