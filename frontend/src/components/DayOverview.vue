<script setup>
import { ref, watch, onMounted } from "vue";

const props = defineProps({
  token: {
    type: String,
    default: null,
  },
});

const date = ref(new Date().toISOString().slice(0, 10)); // "YYYY-MM-DD"
const loading = ref(false);
const errorMessage = ref("");
const overview = ref([]); // Liste der Medikamente + Status
const savingId = ref(null); // welches Medikament gerade "genommen" wird

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
          class="day-card"
        >
          <div class="day-left">
            <div class="pill-icon">💊</div>
            <div class="day-text">
              <div class="day-name">{{ item.name }}</div>
              <div class="day-line">
                {{ item.dosage }}
                <span v-if="item.times && item.times.length">
                  – {{ item.times.join(", ") }}
                </span>
              </div>
              <div class="day-status-row">
                Status:
                <span
                  v-if="item.taken"
                  class="status-taken"
                >
                  genommen ✅
                </span>
                <span
                  v-else
                  class="status-open"
                >
                  noch offen ⏳
                </span>
              </div>
            </div>
          </div>

          <div class="day-right fixed-right">
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
  margin-bottom: 1rem;
  text-align: center;
}

.day-date-row input[type='date'] {
  margin-left: 0.5rem;
  padding: 0.3rem 0.5rem;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  font-size: 0.9rem;
}

.error-text {
  color: red;
}

.day-list {
  margin-top: 0.5rem;
}

/* --- Karte wie Medikamentenliste --- */
.day-card {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 1rem;

  background: #f6f2ff;
  border-radius: 16px;
  padding: 0.7rem 1.25rem 0.6rem 1.25rem; /* oben / rechts / unten / links */
  margin-bottom: 0.9rem;
  box-shadow: 0 10px 25px rgba(31, 41, 55, 0.08);
  min-height: 80px; /* optional etwas kleiner */
}

/* Linke Spalte */
.day-left {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1; /* wichtige Änderung → Button bleibt rechts */
}

.pill-icon {
  font-size: 1.5rem;
}

.day-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.day-name {
  font-weight: 600;
  color: #1f2933;
  font-size: 1.05rem;
}

.day-line {
  font-size: 0.9rem;
  color: #4b5563;
}

.day-status-row {
  font-size: 0.9rem;
  color: #4b5563;
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

.day-right {
  display: flex;
  align-items: flex-start; /* Button oben statt mittig */
  justify-content: center;
  min-width: 200px;
  padding-top: 4px; /* optional: feine Justierung */
}

/* Standard Button Style */
.day-btn {
  width: 100%;
  text-align: center;
  border: none;
  border-radius: 999px;
  padding: 0.55rem 0.8rem;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.05s ease;
}

/* LILA Button – Einnahme dokumentieren (dunkler) */
.day-btn-primary {
  background: linear-gradient(90deg, #4f46e5, #4338ca);
  color: #ffffff;
  box-shadow: 0 10px 25px rgba(67, 56, 202, 0.35);
}

.day-btn-primary:hover {
  transform: translateY(-1px);
}

.day-btn-disabled {
  background: #e4e8ff;
  color: #27329f;
  box-shadow: none;
}

.day-btn:disabled {
  cursor: default;
  opacity: 1;
}
</style>