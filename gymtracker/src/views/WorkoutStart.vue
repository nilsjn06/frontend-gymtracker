<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createWorkout } from '../services/api'

const router = useRouter()
const date = ref<string>('')
const title = ref<string>('')
const loading = ref(false)
const error = ref<string | null>(null)

async function submit() {
  error.value = null
  if (!date.value) {
    error.value = 'Bitte ein Datum auswählen.'
    return
  }
  // Titel ist jetzt Pflicht
  if (!title.value || !title.value.trim()) {
    error.value = 'Bitte einen Titel eingeben.'
    return
  }
  loading.value = true
  try {
    const dto = { date: date.value, title: title.value.trim() }
    const created = await createWorkout(dto)
    // Weiter zur Seite zum Hinzufügen von Sets
    await router.push(`/workouts/${created.id}/sets`)
  } catch (e: any) {
    error.value = e.message ?? 'Unbekannter Fehler'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container">
    <h1>Neues Workout anlegen</h1>

    <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>

    <form @submit.prevent="submit">
      <div class="mb-3">
        <label for="date" class="form-label">Datum</label>
        <input id="date" type="date" class="form-control" v-model="date" />
      </div>

      <div class="mb-3">
        <label for="title" class="form-label">Titel <span class="text-danger">*</span></label>
        <input id="title" type="text" class="form-control" v-model="title" placeholder="z.B. Push" required />
      </div>

      <button type="submit" class="btn btn-primary" :disabled="loading">
        {{ loading ? 'erzeuge...' : 'neues Workout starten' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
/* Minimal styling; der Navbar-Abstand wird in App.vue behandelt */
.container { padding: 1rem; }
</style>
