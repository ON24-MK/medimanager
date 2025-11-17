<script setup>
const props = defineProps({
  medications: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["delete-medication", "edit-medication"]);

function requestDelete(id) {
  emit("delete-medication", id);
}

function requestEdit(med) {
  emit("edit-medication", med);
}
</script>

<template>
  <section class="med-list">
    <h2>Deine Medikamentenliste</h2>

    <!-- Nichts vorhanden -->
    <p v-if="!props.medications.length" class="med-list__empty">
      Keine Medikamente gespeichert.
    </p>

    <!-- Liste -->
    <ul v-else class="med-list__items">
      <li
        v-for="med in props.medications"
        :key="med.id"
        class="med-list__item"
      >
        <!-- Linke Seite: Icon + Text -->
        <div class="med-list__info">
          <span class="med-list__icon" aria-hidden="true">💊</span>
          <div class="med-list__text">
            <div class="med-list__name">
              {{ med.name }}
            </div>
            <div class="med-list__details">
              {{ med.dosage }}
              <span v-if="med.times && med.times.length">
                – {{ med.times.join(", ") }}
              </span>
            </div>
          </div>
        </div>

        <!-- Rechte Seite: Buttons immer bündig -->
        <div class="med-list__actions">
          <button
            type="button"
            class="med-btn med-btn--secondary"
            @click="requestEdit(med)"
          >
            Bearbeiten
          </button>

          <button
            type="button"
            class="med-btn med-btn--danger"
            @click="requestDelete(med.id)"
          >
            Löschen
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.med-list {
  margin-top: 2rem;
}

.med-list__empty {
  color: #555;
  margin-top: 0.5rem;
}

.med-list__items {
  list-style: none;
  margin: 1rem 0 0;
  padding: 0;
}

.med-list__item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.8rem 1rem;
  margin-bottom: 0.5rem;
  border-radius: 12px;
  background: #f5f3ff;
}

/* Linke Seite */
.med-list__info {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;           /* nimmt alles links ein */
  min-width: 0;      /* damit lange Namen umbrechen können */
}

/* Icon hat feste Breite → Text startet immer gleich */
.med-list__icon {
  font-size: 1.4rem;
  flex-shrink: 0;
  width: 32px;       /* fix */
  text-align: center;
  margin-top: 2px;
}

.med-list__text {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.med-list__name {
  font-weight: 600;
  color: #1f2933;
  word-break: break-word;
  line-height: 1.2rem;  
  min-height: 1.2rem;   
  display: flex;
  align-items: center;   
}

.med-list__details {
  font-size: 0.9rem;
  color: #4b5563;
}

/* Rechte Seite: Buttons fest rechts */
.med-list__actions {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;   /* schiebt sie ganz nach rechts */
  flex-shrink: 0;
  min-width: 170px;    /* immer gleich breiter Button-Bereich */
  justify-content: flex-end;
}

/* Buttons */
.med-btn {
  border: none;
  border-radius: 999px;
  padding: 0.35rem 0.9rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.05s ease;
  white-space: nowrap;
}

.med-btn:hover {
  transform: translateY(-1px);
}

.med-btn--secondary {
  background: #e0e7ff;
  color: #1f2a7a;
}

.med-btn--secondary:hover {
  background: #c7d2ff;
}

.med-btn--danger {
  background: #fee2e2;
  color: #b91c1c;
}

.med-btn--danger:hover {
  background: #fecaca;
}

.med-list__empty {
  color: #555;
  font-size: 0.85rem;   /* kleinerer Text */
  margin-top: 0.25rem;  /* weniger Abstand nach oben */
  margin-bottom: 0.3rem; /* weniger Abstand nach unten */
}
</style>