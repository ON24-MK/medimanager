<template>
  <div
    style="padding: 2rem; font-family: sans-serif; max-width: 900px; margin: 0 auto;"
  >
    <h1>MediManager</h1>

    <!-- Wenn KEIN Token vorhanden ist: Login anzeigen -->
    <div v-if="!token">
      <p v-if="authError" style="color: red; margin-bottom: 0.5rem;">
        {{ authError }}
      </p>

      <LoginForm @login-success="handleLoginSuccess" />
    </div>

    <!-- Wenn Token vorhanden ist: App-Bereich -->
    <div v-else>
      <div
        style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;"
      >
        <h2 style="margin: 0;">Willkommen 👋</h2>
        <button @click="logout">Logout</button>
      </div>

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

      <!-- Formular: Medikament hinzufügen -->
      <MedicationForm
        :token="token"
        @medication-created="handleMedicationCreated"
      />

      <!-- Medikamentenliste -->
      <MedicationsList :medications="medications" />
    </

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import BackendStatus from './components/BackendStatus.vue';
import MedicationsList from './components/MedicationsList.vue';
import LoginForm from './components/LoginForm.vue';
import MedicationForm from './components/MedicationForm.vue';

const token = ref(localStorage.getItem("token") || null);

const authError = ref("");

const health = ref(null);
const medications = ref([]);

async function loadData() {
  try {
    authError.value = "";

    // Health-Check (öffentlich)
    const res = await fetch('http://localhost:8000/api/health');
    health.value = await res.json();

    
    if (!token.value) {
      medications.value = [];
      return;
    }

    // Medikamente (geschützt)
    const medsRes = await fetch('http://localhost:8000/api/medications', {
      headers: {
        "Authorization": "Bearer " + token.value,
      },
    });

    // Token ungültig / abgelaufen → 401
    if (medsRes.status === 401) {
      authError.value = "Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.";
      token.value = null;
      localStorage.removeItem("token");
      medications.value = [];
      return;
    }

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

function logout() {
  token.value = null;
  localStorage.removeItem("token");
  authError.value = "";
  medications.value = [];

  // Health ohne Token neu laden (optional)
  loadData();
}

function handleMedicationCreated() {
  // Nach dem Anlegen einfach die Liste neu laden
  loadData();
}

onMounted(async () => {
  if (token.value) {
    await loadData();
  } else {
    await loadData(); // lädt zumindest Health
  }
});
</script>


<style>
body {
  margin: 0;
}
</style>


