<template>
  <section style="margin-top: 2rem;">
    <h2>Medikament bearbeiten</h2>

    <form @submit.prevent="handleSubmit">
      <div style="margin-bottom: 0.5rem;">
        <label>
          Medikamentenname<br />
          <input v-model="name" type="text" />
        </label>
      </div>

      <div style="margin-bottom: 0.5rem;">
        <label>
          Dosierung<br />
          <input v-model="dosage" type="text" />
        </label>
      </div>

      <div style="margin-bottom: 0.5rem;">
        <label>
          Einnahmezeit<br />
          <input v-model="timesText" type="text" placeholder="z.B. morgens, abends" />
        </label>
      </div>

      <div style="margin-bottom: 0.5rem;">
        <label>
          Notizen<br />
          <textarea
            v-model="notes"
            rows="2"
            style="width: 100%; max-width: 300px;"
          ></textarea>
        </label>
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Speichere…' : 'Änderungen speichern' }}
      </button>

      <button
        type="button"
        style="margin-left: 0.5rem;"
        @click="$emit('cancel')"
      >
        Abbrechen
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

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  token: {
    type: String,
    default: null,
  },
  medication: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['medication-updated', 'cancel']);

const name = ref(props.medication.name || '');
const dosage = ref(props.medication.dosage || '');
const timesText = ref(
  Array.isArray(props.medication.times)
    ? props.medication.times.join(', ')
    : ''
);
const notes = ref(props.medication.notes || '');

const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

// Falls sich medication-Prop ändert (z.B. anderes Medikament gewählt)
watch(
  () => props.medication,
  (newMed) => {
    if (!newMed) return;
    name.value = newMed.name || '';
    dosage.value = newMed.dosage || '';
    timesText.value = Array.isArray(newMed.times)
      ? newMed.times.join(', ')
      : '';
    notes.value = newMed.notes || '';
  },
  { deep: true }
);

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
      ? timesText.value.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const res = await fetch(
      `http://localhost:8000/api/medications/${props.medication.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + props.token,
        },
        body: JSON.stringify({
          name: name.value,
          dosage: dosage.value,
          times: timesArray,
          notes: notes.value,
        }),
      }
    );

    if (res.status === 401) {
      errorMessage.value = 'Sitzung abgelaufen. Bitte neu einloggen.';
      return;
    }

    if (!res.ok) {
      errorMessage.value = 'Fehler beim Aktualisieren.';
      console.error('Status:', res.status);
      return;
    }

    const updated = await res.json();
    successMessage.value = 'Medikament wurde aktualisiert.';

    emit('medication-updated', updated);
  } catch (err) {
    console.error(err);
    errorMessage.value = 'Server nicht erreichbar.';
  } finally {
    loading.value = false;
  }
}
</script>

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