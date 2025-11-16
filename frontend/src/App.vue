<template>
  <div style="padding: 2rem; font-family: sans-serif; max-width: 900px; margin: 0 auto;">
    <h1>MediManager</h1>

    <!-- Wenn KEIN Token vorhanden ist: nur Login anzeigen -->
    <div v-if="!token">
      <LoginForm @login-success="handleLoginSuccess" />
    </div>

    <!-- Wenn Token vorhanden ist: eigentliche App anzeigen -->
    <div v-else>
      <!-- Backend-Status -->
      <BackendStatus :health="health" />

      <hr style="margin: 2rem 0;" />

      <h2>App-Bereiche (Plan):</h2>
      <ul>
        <li>Medikamentenliste</li>
        <li>Medikament hinzufügen</li>
        <li>Tagesübersicht</li>
        <li>Tagebuch</li>
      </ul>

      <hr style="margin: 2rem 0;" />

      <!-- Medikamentenliste -->
      <MedicationsList :medications="medications" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import BackendStatus from './components/BackendStatus.vue';
import MedicationsList from './components/MedicationsList.vue';
import LoginForm from './components/LoginForm.vue';

const token = ref(localStorage.getItem("token") || null);

// Backend
const health = ref(null);
const medications = ref([]);

// Backend-Daten laden (mit Token für geschützte Routen)
async function loadData() {
  try {
    // Health-Check (ist bei dir öffentlich, braucht keinen Token)
    const res = await fetch('http://localhost:8000/api/health');
    health.value = await res.json();

    // Medikamente (geschützt → braucht Authorization-Header)
    if (!token.value) {
      medications.value = [];
      return;
    }

    const medsRes = await fetch('http://localhost:8000/api/medications', {
      headers: {
        "Authorization": "Bearer " + token.value,
      },
    });

    if (!medsRes.ok) {
      console.error("Fehler beim Laden der Medikamente:", medsRes.status);
      medications.value = [];
      return;
    }

    const medsData = await medsRes.json();
    medications.value = medsData.medications ?? [];
  } catch (err) {
    console.error('Fehler beim Fetch:', err);
    health.value = { error: 'Backend nicht erreichbar' };
  }
}


async function handleLoginSuccess(receivedToken) {
  token.value = receivedToken;
  localStorage.setItem("token", receivedToken);
  console.log("Login erfolgreich! Token gespeichert:", receivedToken);

  
  await loadData();
}

// Beim Laden der Seite: wenn schon ein Token existiert → Daten laden
onMounted(async () => {
  if (token.value) {
    await loadData();
  }
});
</script>

<style>
body {
  margin: 0;
}
</style>


