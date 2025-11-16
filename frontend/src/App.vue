<template>
  <div
    style="padding: 2rem; font-family: sans-serif; max-width: 900px; margin: 0 auto;"
  >
    <h1>MediManager</h1>

    <!-- LOGIN-BEREICH -->
    <div v-if="!token">
      <p v-if="authError" style="color: red; margin-bottom: 0.5rem;">
        {{ authError }}
      </p>
      <LoginForm @login-success="handleLoginSuccess" />
    </div>

    <!-- EINGELOGGTER BEREICH -->
    <div v-else>
      <div
        style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;"
      >
        <h2 style="margin: 0;">Willkommen 👋</h2>
        <button @click="logout">Logout</button>
      </div>

      <!-- Backend Status -->
      <BackendStatus :health="health" />

      <hr style="margin: 2rem 0;" />

      <h2>App-Bereiche</h2>
      <ul>
        <li>Medikamentenliste</li>
        <li>Medikament hinzufügen</li>
        <li>Tagesübersicht</li>
        <li>Tagebuch</li>
      </ul>

      <hr style="margin: 2rem 0;" />

      <!-- Medikament hinzufügen -->
      <MedicationForm
        :token="token"
        @medication-created="handleMedicationCreated"
      />

      <!-- Medikamentenliste -->
      <MedicationsList
        :medications="medications"
        @delete-medication="handleMedicationDelete"
        @edit-medication="startEditMedication"
      />

      <!-- Medikament bearbeiten (nur wenn eins ausgewählt) -->
      <EditMedicationForm
        v-if="selectedMedicationForEdit"
        :token="token"
        :medication="selectedMedicationForEdit"
        @cancel="selectedMedicationForEdit = null"
        @medication-updated="handleMedicationUpdated"
      />

      <!-- Tagesübersicht -->
      <DayOverview :token="token" />

      <!-- Tagebuch -->
      <IntakeLog :token="token" :medications="medications" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

import BackendStatus from './components/BackendStatus.vue';
import MedicationsList from './components/MedicationsList.vue';
import LoginForm from './components/LoginForm.vue';
import MedicationForm from './components/MedicationForm.vue';
import EditMedicationForm from './components/EditMedicationForm.vue';
import DayOverview from './components/DayOverview.vue';
import IntakeLog from './components/IntakeLog.vue';

// TOKEN & FEHLER
const token = ref(localStorage.getItem("token") || null);
const authError = ref("");

// BACKEND DATEN
const health = ref(null);
const medications = ref([]);
const selectedMedicationForEdit = ref(null);

// BACKEND DATEN LADEN
async function loadData() {
  try {
    authError.value = "";

    // Health (öffentlich)
    const res = await fetch("http://localhost:8000/api/health");
    health.value = await res.json();

    // Wenn nicht eingeloggt → nur Health
    if (!token.value) {
      medications.value = [];
      return;
    }

    // Medis (geschützt)
    const medsRes = await fetch("http://localhost:8000/api/medications", {
      headers: {
        Authorization: "Bearer " + token.value,
      },
    });

    if (medsRes.status === 401) {
      authError.value = "Sitzung abgelaufen. Bitte neu einloggen.";
      token.value = null;
      localStorage.removeItem("token");
      medications.value = [];
      return;
    }

    const medsData = await medsRes.json();
    medications.value = medsData.medications ?? [];
  } catch (err) {
    console.error(err);
    health.value = { error: "Backend nicht erreichbar" };
  }
}

// LOGIN ERFOLG
async function handleLoginSuccess(receivedToken) {
  token.value = receivedToken;
  localStorage.setItem("token", receivedToken);
  await loadData();
}

// LOGOUT
function logout() {
  token.value = null;
  localStorage.removeItem("token");
  authError.value = "";
  medications.value = [];
  selectedMedicationForEdit.value = null;
  loadData();
}

// NACH MEDIKAMENT-ERSTELLUNG
function handleMedicationCreated() {
  loadData();
}

// MEDIKAMENT LÖSCHEN
async function handleMedicationDelete(id) {
  if (!token.value) return;

  try {
    const res = await fetch(`http://localhost:8000/api/medications/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + token.value,
      },
    });

    if (res.status === 401) {
      authError.value = "Sitzung abgelaufen.";
      logout();
      return;
    }

    await loadData();
  } catch {
    authError.value = "Server nicht erreichbar.";
  }
}

// MEDIKAMENT ZUM BEARBEITEN AUSWÄHLEN
function startEditMedication(med) {
  selectedMedicationForEdit.value = med;
}

// NACH UPDATE → Liste neu laden & Formular schließen
async function handleMedicationUpdated() {
  await loadData();
  selectedMedicationForEdit.value = null;
}

// BEI START LADEN
onMounted(async () => {
  await loadData();
});
</script>


<style>
body {
  margin: 0;
}
</style>


