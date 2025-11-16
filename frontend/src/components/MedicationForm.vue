<script setup>
import { ref } from 'vue';

const props = defineProps({
  token: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['medication-created']);

const name = ref('');
const dosage = ref('');
const timesText = ref(''); // z.B. "morgens, abends"
const notes = ref('');

const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

async function handleSubmit() {
  errorMessage.value = '';
  successMessage.value = '';

  if (!props.token) {
    errorMessage.value = 'Du bist nicht eingeloggt.';
    return;
  }

  if (!name.value || !dosage.value) {
    errorMessage.value = 'Name und Dosierung sind Pflichtfelder.';
    return;
  }

  loading.value = true;

  try {
    const timesArray = timesText.value
      ? timesText.value.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    const res = await fetch('http://localhost:8000/api/medications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + props.token,
      },
      body: JSON.stringify({
        name: name.value,
        dosage: dosage.value,
        times: timesArray,
        notes: notes.value,
      }),
    });

    if (res.status === 401) {
      errorMessage.value = 'Sitzung abgelaufen. Bitte neu einloggen.';
      return;
    }

    if (!res.ok) {
      errorMessage.value = 'Fehler beim Anlegen des Medikaments.';
      console.error('Fehlerstatus:', res.status);
      return;
    }

    const created = await res.json();

    name.value = '';
    dosage.value = '';
    timesText.value = '';
    notes.value = '';

    successMessage.value = 'Medikament wurde angelegt.';

    emit('medication-created', created);
  } catch (err) {
    console.error(err);
    errorMessage.value = 'Server nicht erreichbar.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section style="margin-bottom: 2rem;">
    <h2>Neues Medikament hinzufügen</h2>

    <form @submit.prevent="handleSubmit">
      <div style="margin-bottom: 0.5rem;">
        <label>
          Medikamentenname<br />
          <input v-model="name" type="text" placeholder="z.B. Medikinet" />
        </label>
      </div>

      <div style="margin-bottom: 0.5rem;">
        <label>
          Dosierung<br />
          <input v-model="dosage" type="text" placeholder="z.B. 10 mg" />
        </label>
      </div>

      <div style="margin-bottom: 0.5rem;">
        <label>
          Einnahmezeiten<br />
          <input v-model="timesText" type="text" placeholder="z.B. morgens, mittags oder abends" />
        </label>
      </div>

      <div style="margin-bottom: 0.5rem;">
        <label>
          Notizen<br />
          <textarea v-model="notes" rows="2" style="width: 100%; max-width: 300px;"></textarea>
        </label>
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Speichern…' : 'Medikament anlegen' }}
      </button>
    </form>

    <p v-if="errorMessage" style="color: red; margin-top: 0.5rem;">
      {{ errorMessage }}
    </p>
    <p v-if="successMessage" style="color: green; margin-top: 0.5rem;">
      {{ successMessage }}
    </p>
  </section>
</template>

<style scoped>
input {
  padding: 0.35rem 0.5rem;
  width: 100%;
  max-width: 300px;
  box-sizing: border-box;
}
button {
  padding: 0.4rem 0.8rem;
  cursor: pointer;
}
</style>