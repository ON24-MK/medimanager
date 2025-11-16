<script setup>
const props = defineProps({
  medications: {
    type: Array,
    default: () => [],
  },
});
</script>

<template>
  <section>
    <h2>Medikamentenliste (aus Backend):</h2>

    <ul v-if="props.medications.length">
      <li v-for="med in props.medications" :key="med.id">
        {{ med.name }} – {{ med.dosage }}
        <span v-if="med.times && med.times.length">
          ({{ med.times.join(", ") }})
        </span>
      </li>
    </ul>

    <p v-else>Keine Medikamente geladen.</p>
  </section>
</template>