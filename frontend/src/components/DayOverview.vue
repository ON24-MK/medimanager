<script setup>
import { ref, watch, onMounted } from 'vue';

const props = defineProps({
  token: {
    type: String,
    default: null,
  },
});

const date = ref(new Date().toISOString().slice(0, 10)); // "YYYY-MM-DD"
const loading = ref(false);
const errorMessage = ref('');
const overview = ref([]); // Liste der Medikamente + Status
const savingId = ref(null); // welches Medikament gerade "genommen" wird

async function loadOverview() {
  errorMessage.value = '';
  overview.value = [];

  if (!props.token) {
    errorMessage.value = 'Du bist nicht eingeloggt.';
    return;
  }

  loading.value = true;

  try {
    const res = await fetch(
      `http://localhost:8000/api/day-overview?date=${date.value}`,
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
      errorMessage.value = 'Fehler beim Laden der Tagesübersicht.';
      console.error('Status:', res.status);
      return;
    }

    const data = await res.json();
    overview.value = data.overview ?? [];
  } catch (err) {
    console.error(err);
    errorMessage.value = 'Server nicht erreichbar.';
  } finally {
    loading.value = false;
  }
}

// Einnahme für ein Medikament dokumentieren
async function markTaken(medicationId) {
  if (!props.token) {
    errorMessage.value = 'Du bist nicht eingeloggt.';
    return;
  }

  errorMessage.value = '';
  savingId.value = medicationId;

  try {
    const res = await fetch('http://localhost:8000/api/intakes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + props.token,
      },
      body: JSON.stringify({
        medicationId,
        date: date.value,
        taken: true,
      }),
    });

    if (res.status === 401) {
      errorMessage.value = 'Sitzung abgelaufen. Bitte neu einloggen.';
      return;
    }

    if (!res.ok) {
      errorMessage.value = 'Fehler beim Speichern der Einnahme.';
      console.error('Status:', res.status);
      return;
    }

    // Nach erfolgreichem Speichern: Übersicht neu laden
    await loadOverview();
  } catch (err) {
    console.error(err);
    errorMessage.value = 'Server nicht erreichbar.';
  } finally {
    savingId.value = null;
  }
}

// Beim ersten Mount direkt laden
onMounted(() => {
  loadOverview();
});

// Bei Datumsänderung neu laden
watch(date, () => {
  loadOverview();
});
</script>

<template>
  <section style="margin-top: 2rem;">
    <h2>Tagesübersicht</h2>

    <div style="margin-bottom: 0.5rem;">
      <label>
        Datum wählen:
        <input v-model="date" type="date" />
      </label>
    </div>

    <p v-if="loading">Lade Tagesübersicht…</p>

    <p v-if="errorMessage" style="color: red;">
      {{ errorMessage }}
    </p>

    <div v-if="!loading && !errorMessage">
      <p v-if="!overview.length">
        Für dieses Datum sind keine Medikamente oder Einnahmen hinterlegt.
      </p>

      <ul v-else>
        <li
          v-for="item in overview"
          :key="item.id"
          style="margin-bottom: 0.75rem; padding: 0.5rem; border: 1px solid #ddd; border-radius: 6px;"
        >
          <strong>{{ item.name }}</strong> – {{ item.dosage }}
          <span v-if="item.times && item.times.length">
            ({{ item.times.join(', ') }})
          </span>
          <br />
          Status:
          <span v-if="item.taken" style="color: green;">genommen ✅</span>
          <span v-else style="color: orange;">noch offen ⏳</span>

          <div style="margin-top: 0.5rem;">
            <button
              @click="markTaken(item.id)"
              :disabled="item.taken || savingId === item.id"
            >
              {{ item.taken ? 'Schon dokumentiert' : (savingId === item.id ? 'Speichere…' : 'Einnahme jetzt dokumentieren') }}
            </button>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
input[type='date'] {
  margin-left: 0.5rem;
}
button {
  padding: 0.35rem 0.7rem;
  cursor: pointer;
}
</style>