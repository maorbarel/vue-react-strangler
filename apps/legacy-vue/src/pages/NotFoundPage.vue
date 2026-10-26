<script setup>
import { useRoute } from "vue-router";

const route = useRoute();
</script>

<template>
  <section>
    <h1>Not found</h1>
    <p>No legacy route matches <code>{{ route.fullPath }}</code>.</p>
  </section>
</template>
