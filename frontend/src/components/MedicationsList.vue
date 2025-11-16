<script setup>
const props = defineProps({
  medications: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['delete-medication', 'edit-medication']);

function requestDelete(id) {
  const sicher = confirm('Willst Du dieses Medikament wirklich löschen?');
  if (!sicher) return;
  emit('delete-medication', id);
}

function requestEdit(med) {
  emit('edit-medication', med);
}
</script>

<template>
  <section>
    <h2>Deine Medikamentenliste</h2>

    <ul v-if="props.medications.length">
      <li
        v-for="med in props.medications"
        :key="med.id"
        style="margin-bottom: 0.5rem;"
      >
        {{ med.name }} – {{ med.dosage }}
        <span v-if="med.times && med.times.length">
          ({{ med.times.join(', ') }})
        </span>

        <button
          style="margin-left: 0.5rem;"
          @click="requestEdit(med)"
        >
          Bearbeiten
        </button>

        <button
          style="margin-left: 0.5rem;"
          @click="requestDelete(med.id)"
        >
          Löschen
        </button>
      </li>
    </ul>

    <p v-else>Keine Medikamente geladen.</p>
  </section>
</template>