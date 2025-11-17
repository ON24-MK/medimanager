<script setup>
import { ref, watch, onMounted } from "vue";

const props = defineProps({
  token: {
    type: String,
    default: null,
  },
});

const date = ref(new Date().toISOString().slice(0, 10));
const loading = ref(false);
const errorMessage = ref("");
const overview = ref([]);
const savingId = ref(null);

async function loadOverview() {
  errorMessage.value = "";
  overview.value = [];

  if (!props.token) {
    errorMessage.value = "Du bist nicht eingeloggt.";
    return;
  }

  loading.value = true;

  try {
    const res = await fetch(
      `http://localhost:8000/api/day-overview?date=${date.value}`,
      {
        headers: {
          Authorization: "Bearer " + props.token,
        },
      },
    );

    if (res.status === 401) {
      errorMessage.value = "Sitzung abgelaufen. Bitte neu einloggen.";
      return;
    }

    if (!res.ok) {
      errorMessage.value = "Fehler beim Laden der Tagesübersicht.";
      console.error("Status:", res.status);
      return;
    }

    const data = await res.json();
    overview.value = data.overview ?? [];
  } catch (err) {
    console.error(err);
    errorMessage.value = "Server nicht erreichbar.";
  } finally {
    loading.value = false;
  }
}

async function markTaken(medicationId) {
  if (!props.token) {
    errorMessage.value = "Du bist nicht eingeloggt.";
    return;
  }

  errorMessage.value = "";
  savingId.value = medicationId;

  try {
    const res = await fetch("http://localhost:8000/api/intakes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + props.token,
      },
      body: JSON.stringify({
        medicationId,
        date: date.value,
        taken: true,
      }),
    });

    if (res.status === 401) {
      errorMessage.value = "Sitzung abgelaufen. Bitte neu einloggen.";
      return;
    }

    if (!res.ok) {
      errorMessage.value = "Fehler beim Speichern der Einnahme.";
      console.error("Status:", res.status);
      return;
    }

    await loadOverview();
  } catch (err) {
    console.error(err);
    errorMessage.value = "Server nicht erreichbar.";
  } finally {
    savingId.value = null;
  }
}

onMounted(() => {
  loadOverview();
});

watch(date, () => {
  loadOverview();
});
</script>

<template>
  <section class="day-section">
    <h2 class="day-title">Tagesübersicht</h2>

    <div class="day-date-row">
      <label>
        Datum wählen:
        <input v-model="date" type="date" />
      </label>
    </div>

    <p v-if="loading">Lade Tagesübersicht…</p>

    <p v-if="errorMessage" class="error-text">
      {{ errorMessage }}
    </p>

    <div v-if="!loading && !errorMessage">
      <p v-if="!overview.length">
        Für dieses Datum sind keine Medikamente oder Einnahmen hinterlegt.
      </p>

      <div v-else class="day-list">
        <div
          v-for="item in overview"
          :key="item.id"
          class="day-item"
        >
          <div class="day-info">
            <span class="day-icon" aria-hidden="true">💊</span>

            <div class="day-text">
              <div class="day-name">
                {{ item.name }}
              </div>

              <div class="day-details">
                {{ item.dosage }}
                <span v-if="item.times && item.times.length">
                  – {{ item.times.join(", ") }}
                </span>
              </div>

              <div class="day-status-row">
                Status:
                <span v-if="item.taken" class="status-taken">
                  genommen ✅
                </span>
                <span v-else class="status-open">
                  noch offen ⏳
                </span>
              </div>
            </div>
          </div>

          <div class="day-actions">
            <button
              class="day-btn"
              :class="{
                'day-btn-disabled': item.taken,
                'day-btn-primary': !item.taken,
              }"
              @click="markTaken(item.id)"
              :disabled="item.taken || savingId === item.id"
            >
              <span v-if="item.taken">Schon dokumentiert</span>
              <span v-else-if="savingId === item.id">Speichere…</span>
              <span v-else>Einnahme dokumentieren</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.day-section {
  margin-top: 2rem;
}

.day-title {
  font-size: 1.7rem;
  text-align: center;
  margin-bottom: 1rem;
  color: #1c2734;
}

.day-date-row {
  margin-bottom: 0.8rem;
  text-align: center;
}

.day-date-row input[type='date'] {
  margin-left: 0.5rem;
  padding: 0.3rem 0.5rem;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  font-size: 0.9rem;
}

/* kleinerer Loading-Text & Fehlertext */
p[v-if="loading"],
.error-text,
.day-section p {
  font-size: 0.85rem;
}

.day-list {
  margin-top: 0.3rem;
}

/* Box Styling */
.day-item {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  padding: 0.7rem 1rem;
  margin-bottom: 0.45rem;
  border-radius: 12px;
  background: #f5f3ff;
  box-shadow: none;
}

.day-info {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.day-icon {
  font-size: 1.4rem;
  flex-shrink: 0;
  width: 32px;
  text-align: center;
  margin-top: 2px;
}

.day-text {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  text-align: left;
  min-width: 0;
}

.day-name {
  font-weight: 600;
  color: #1f2933;
  word-break: break-word;
  line-height: 1.2rem;
  min-height: 1.2rem;
}

.day-details {
  font-size: 0.88rem;
  color: #4b5563;
}

.day-status-row {
  font-size: 0.88rem;
  color: #4b5563;
}

.status-taken {
  color: #16a34a;
  font-weight: 600;
  margin-left: 0.25rem;
}

.status-open {
  color: #f97316;
  font-weight: 600;
  margin-left: 0.25rem;
}

.day-actions {
  display: flex;
  margin-left: auto;
  flex-shrink: 0;
  min-width: 200px;
  justify-content: flex-end;
}

.day-btn {
  width: 100%;
  text-align: center;
  border: none;
  border-radius: 999px;
  padding: 0.55rem 0.8rem;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

.day-btn-primary {
  background: #4f46e5;
  color: #ffffff;
}

.day-btn-primary:hover {
  transform: translateY(-1px);
}

.day-btn-disabled {
  background: #e4e8ff;
  color: #27329f;
}

.day-btn:disabled {
  opacity: 1;
  cursor: default;
}
</style>