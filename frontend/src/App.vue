<template>
  <div
    style="padding: 2rem; font-family: sans-serif; max-width: 900px; margin: 0 auto;"
  >
    <h1>MediManager</h1>

    <!-- Wenn KEIN Token: Login anzeigen -->
    <div v-if="!token">
      <p v-if="authError" style="color: red; margin-bottom: 0.5rem;">
        {{ authError }}
      </p>

      <LoginForm @login-success="handleLoginSuccess" />
    </div>

    <!-- Wenn Token vorhanden: App -->
    <div v-else>
      <!-- Kopfzeile -->
      <div
        style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;"
      >
        <h2 style="margin: 0;">Willkommen 👋</h2>
        <button @click="logout">Logout</button>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          class="tab"
          :class="{ 'tab--active': activeTab === 'meds' }"
          @click="activeTab = 'meds'"
        >
          Medikamente
        </button>

        <button
          class="tab"
          :class="{ 'tab--active': activeTab === 'overview' }"
          @click="activeTab = 'overview'"
        >
          Tagesübersicht
        </button>

        <button
          class="tab"
          :class="{ 'tab--active': activeTab === 'log' }"
          @click="activeTab = 'log'"
        >
          Tagebuch
        </button>
      </div>

      <!-- TAB: Medikamente -->
      <div v-if="activeTab === 'meds'">
        <MedicationForm
          :token="token"
          @medication-created="handleMedicationCreated"
        />

        <MedicationsList
          :medications="medications"
          @delete-medication="handleMedicationDelete"
          @edit-medication="startEditMedication"
        />

        <EditMedicationForm
          v-if="selectedMedicationForEdit"
          :token="token"
          :medication="selectedMedicationForEdit"
          @cancel="selectedMedicationForEdit = null"
          @medication-updated="handleMedicationUpdated"
        />
      </div>

      <!-- TAB: Tagesübersicht -->
      <div v-else-if="activeTab === 'overview'">
        <DayOverview :token="token" />
      </div>

      <!-- TAB: Tagebuch -->
      <div v-else>
        <IntakeLog :token="token" :medications="medications" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
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
const activeTab = ref("meds"); // 'meds' | 'overview' | 'log'

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
  background: #f5f5fa;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

h2 {
  margin-top: 0;
}

/* Alle Sektionen (Status, Liste, Formulare, Overview, Tagebuch) als Cards */
section {
  background: #ffffff;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
  border: 1px solid #e5e7eb;
}

/* Buttons einheitlich */
button {
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  border: 1px solid #4f46e5;
  background: #4f46e5;
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease,
    box-shadow 0.15s ease;
}

button:hover {
  background: #4338ca;
  box-shadow: 0 2px 6px rgba(79, 70, 229, 0.35);
  transform: translateY(-1px);
}

button:disabled {
  opacity: 0.6;
  cursor: default;
  box-shadow: none;
  transform: none;
}

/* Listen etwas luftiger */
ul {
  padding-left: 1.2rem;
}

li {
  line-height: 1.4;
}

/* Inputs global etwas hübscher, falls kein scoped Style greift */
input,
textarea {
  border-radius: 6px;
  border: 1px solid #d4d4d8;
  padding: 0.35rem 0.5rem;
  font-size: 0.9rem;
  font-family: inherit;
  box-sizing: border-box;
}

.tabs {
  display: inline-flex;
  padding: 0.25rem;
  border-radius: 999px;
  background: #e5e7eb;
  margin-bottom: 1.5rem;
}

.tab {
  border-radius: 999px;
  border: none;
  background: transparent;
  padding: 0.35rem 0.9rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.tab + .tab {
  margin-left: 0.25rem;
}

.tab--active {
  background: #4f46e5;
  color: white;
}
</style>


