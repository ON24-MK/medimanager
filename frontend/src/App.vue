<template>
  <div style="padding: 2rem; font-family: sans-serif;">
    <h1>MediManager</h1>

    <h2>Backend Status:</h2>
    <pre>{{ health }}</pre>

    <p v-if="!health">Lade Backend-Daten...</p>

    <hr style="margin: 2rem 0;" />

    <h2>App:</h2>
    <ul>
      <li>Medikamentenliste</li>
      <li>Medikament hinzufügen</li>
      <li>Tagesübersicht</li>
      <li>Tagebuch</li>
    </ul>

    <hr style="margin: 2rem 0;" />

    <h2>Medikamentenliste (aus Backend):</h2>
    <ul>
      <li v-for="med in medications" :key="med.id">
        {{ med.name }} – {{ med.dosage }} ({{ med.times.join(", ") }})
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// Backend
const health = ref(null);

// Medikamente
const medications = ref([]);

onMounted(async () => {
  try {
    const res = await fetch("http://localhost:8000/api/health");
    health.value = await res.json();

    // die Medis laden
    const medsRes = await fetch("http://localhost:8000/api/medications");
    const medsData = await medsRes.json();
    medications.value = medsData.medications;

  } catch (err) {
    console.error("Fehler beim Fetch:", err);
    health.value = { error: "Backend nicht erreichbar" };
  }
});
</script>

<style>
body {
  margin: 0;
}
</style>


