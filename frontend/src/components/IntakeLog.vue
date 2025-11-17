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
  <section class="log-section">
    <h2 class="log-title">Tagebuch</h2>

    <div class="log-date-row">
      <label>
        Datum wählen:
        <input v-model="date" type="date" />
      </label>
    </div>

    <p v-if="loading">Lade Einträge…</p>

    <p v-if="errorMessage" class="error-text">
      {{ errorMessage }}
    </p>

    <div v-if="!loading && !errorMessage">
      <p v-if="!intakes.length">
        Für dieses Datum wurden noch keine Einnahmen dokumentiert.
      </p>

      <div v-else class="log-list">
        <div
          v-for="entry in intakes"
          :key="entry.id"
          class="log-item"
        >
          <div class="log-info">
            <span class="log-icon" aria-hidden="true">💊</span>

            <div class="log-text">
              <div class="log-name">
                {{ getMedicationName(entry.medicationId) }}
              </div>

              <div class="log-details">
                Datum: {{ entry.date }}
                <span v-if="entry.time">
                  – Zeit: {{ entry.time }}
                </span>
              </div>

              <div class="log-status-row">
                Status:
                <span v-if="entry.taken" class="status-taken">
                  genommen ✅
                </span>
                <span v-else class="status-open">
                  nicht genommen ⚠️
                </span>
              </div>

              <div v-if="entry.notes" class="log-notes">
                Notizen: {{ entry.notes }}
              </div>

              <div v-if="entry.createdAt" class="log-meta">
                eingetragen am {{ new Date(entry.createdAt).toLocaleString() }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.log-section {
  margin-top: 2rem;
}

.log-title {
  font-size: 1.7rem;
  text-align: center;
  margin-bottom: 1rem;
  color: #1c2734;
}

.log-date-row {
  margin-bottom: 1rem;
  text-align: center;
}

.log-date-row input[type='date'] {
  margin-left: 0.5rem;
  padding: 0.3rem 0.5rem;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  font-size: 0.9rem;
}

.error-text {
  color: red;
}

.log-list {
  margin-top: 0.5rem;
}

/* Karte wie Tagesübersicht / MedList */
.log-item {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  padding: 0.8rem 1rem;
  margin-bottom: 0.5rem;
  border-radius: 12px;
  background: #f5f3ff;
  box-shadow: 0 10px 25px rgba(31, 41, 55, 0.08);
}

/* Linke Seite */
.log-info {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

/* Icon feste Breite → Text startet immer exakt gleich */
.log-icon {
  font-size: 1.4rem;
  flex-shrink: 0;
  width: 32px;
  text-align: center;
  margin-top: 2px;
}

.log-text {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
  text-align: left;
}

.log-name {
  font-weight: 600;
  color: #1f2933;
  word-break: break-word;
  line-height: 1.2rem;
  min-height: 1.2rem;
  display: flex;
  align-items: center;
}

.log-details {
  font-size: 0.9rem;
  color: #4b5563;
}

.log-status-row {
  font-size: 0.9rem;
  color: #4b5563;
  margin-top: 0.1rem;
}

.status-taken {
  color: #16a34a;
  font-weight: 600;
  margin-left: 0.3rem;
}

.status-open {
  color: #f97316;
  font-weight: 600;
  margin-left: 0.3rem;
}

.log-notes {
  font-size: 0.9rem;
  color: #374151;
  margin-top: 0.1rem;
}

.log-meta {
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 0.2rem;
}
</style>