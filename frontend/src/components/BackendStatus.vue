<script setup>
const props = defineProps({
  health: {
    type: Object,
    default: null,
  },
});
</script>

<template>
  <section>
    <h2>Backend Status:</h2>

    <pre>{{ props.health }}</pre>

    <p v-if="!props.health">Lade Backend-Daten...</p>
  </section>
</template>