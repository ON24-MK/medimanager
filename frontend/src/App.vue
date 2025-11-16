<template>
  <div style="padding: 2rem; font-family: sans-serif; max-width: 900px; margin: 0 auto;">
    <h1>MediManager</h1>
    <!-- Login-Formular (eigene Komponente) -->
<LoginForm />

    <!-- Backend-Status (eigene Komponente) -->
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

    <!-- Medikamentenliste (eigene Komponente) -->
    <MedicationsList :medications="medications" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import BackendStatus from './components/BackendStatus.vue';
import MedicationsList from './components/MedicationsList.vue';
import LoginForm from './components/LoginForm.vue';

// Backend-Zustände
const health = ref(null);
const medications = ref([]);

onMounted(async () => {
  try {
    // Health-Check (öffentlich)
    const res = await fetch('http://localhost:8000/api/health');
    health.value = await res.json();

    // Medikamente (aktuell noch ohne Auth – später Token)
    const medsRes = await fetch('http://localhost:8000/api/medications');
    const medsData = await medsRes.json();
    medications.value = medsData.medications ?? [];
  } catch (err) {
    console.error('Fehler beim Fetch:', err);
    health.value = { error: 'Backend nicht erreichbar' };
  }
});
</script>

<style>
body {
  margin: 0;
}
</style>


