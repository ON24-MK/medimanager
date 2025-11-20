<script setup>
import { ref } from 'vue';

const emit = defineEmits(['login-success']);

const username = ref('');
const password = ref('');
const errorMessage = ref('');
const loading = ref(false);

async function handleSubmit() {
  errorMessage.value = '';
  loading.value = true;

  try {
    const res = await fetch('http://localhost:8000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value,
        password: password.value,
      }),
    });

    if (!res.ok) {
      errorMessage.value = 'Login fehlgeschlagen. Bitte prüfe Benutzername/Passwort.';
      return;
    }

    const data = await res.json();

    emit('login-success', data.token);
  } catch (err) {
    console.error(err);
    errorMessage.value = 'Server nicht erreichbar.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section>
    <h2>Login</h2>

    <form @submit.prevent="handleSubmit">
      <div style="margin-bottom: 0.5rem;">
        <label>
          Benutzername<br />
          <input
            v-model="username"
            type="text"
            placeholder="z.B. admin"
          />
        </label>
      </div>

      <div style="margin-bottom: 0.5rem;">
        <label>
          Passwort<br />
          <input
            v-model="password"
            type="password"
            placeholder="z.B. Passwort"
          />
        </label>
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Anmelden…' : 'Login' }}
      </button>
    </form>

    <p v-if="errorMessage" style="color: red; margin-top: 0.5rem;">
      {{ errorMessage }}
    </p>
  </section>
</template>

<style scoped>
input {
  padding: 0.35rem 0.5rem;
  width: 100%;
  max-width: 250px;
  box-sizing: border-box;
}
button {
  padding: 0.4rem 0.8rem;
  cursor: pointer;
}
</style>