<script setup>
import { ref, onMounted, watch } from 'vue';

const props = defineProps({
  token: {
    type: String,
    default: null,
  },
  medications: {
    type: Array,
    default: () => [],
  },
});

const date = ref(new Date().toISOString().slice(0, 10)); // "YYYY-MM-DD"
const loading = ref(false);
const errorMessage = ref('');
const intakes = ref([]);

// Hilfsfunktion: Medikamenten-Namen finden
function getMedicationName(medicationId) {
  const med = props.medications.find(m => m.id === medicationId);
  return med ? med.name : `Unbekannt (${medicationId})`;
}

async function loadIntakes() {
  errorMessage.value = '';
  intakes.value = [];

  if (!props.token) {
    errorMessage.value = 'Du bist nicht eingeloggt.';
    return;
  }

  loading.value = true;

  try {
    const res = await fetch(
      `http://localhost:8000/api/intakes?date=${date.value}`,
      {
        headers: {
          Authorization: 'Bearer ' + props.token,
        },
      },
    );

    if (res.status === 401) {
      errorMessage.value = 'Sitzung abgelaufen. Bitte neu einloggen.';
      return;
    }

    if (!res.ok) {
      errorMessage.value = 'Fehler beim Laden des Tagebuchs.';
      console.error('Status:', res.status);
      return;
    }

    const data = await res.json();
    intakes.value = data.intakes ?? [];
  } catch (err) {
    console.error(err);
    errorMessage.value = 'Server nicht erreichbar.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadIntakes();
});

watch(date, () => {
  loadIntakes();
});
</script>

<template>
  <section style="margin-top: 2rem;">
    <h2>Tagebuch</h2>

    <div style="margin-bottom: 0.5rem;">
      <label>
        Datum wählen:
        <input v-model="date" type="date" />
      </label>
    </div>

    <p v-if="loading">Lade Einträge…</p>

    <p v-if="errorMessage" style="color: red;">
      {{ errorMessage }}
    </p>

    <div v-if="!loading && !errorMessage">
      <p v-if="!intakes.length">
        Für dieses Datum wurden noch keine Einnahmen dokumentiert.
      </p>

      <ul v-else>
        <li
          v-for="entry in intakes"
          :key="entry.id"
          style="margin-bottom: 0.75rem; padding: 0.5rem; border: 1px solid #ddd; border-radius: 6px;"
        >
          <strong>{{ getMedicationName(entry.medicationId) }}</strong>
          <br />
          Datum: {{ entry.date }}
          <br />
          Status:
          <span v-if="entry.taken" style="color: green;">genommen ✅</span>
          <span v-else style="color: orange;">nicht genommen ⚠️</span>
          <br />
          <span v-if="entry.time">Zeit: {{ entry.time }}</span>
          <span v-if="entry.notes"><br />Notizen: {{ entry.notes }}</span>
          <br />
          <small v-if="entry.createdAt">
            eingetragen am {{ new Date(entry.createdAt).toLocaleString() }}
          </small>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
input[type='date'] {
  margin-left: 0.5rem;
}
</style>