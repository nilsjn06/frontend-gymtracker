<template>
  <div class="container mt-4">
    <h1>Übungen</h1>
    <p>Eine Übersicht aller Übungen aus der Datenbank.</p>

    <p v-if="isLoading">Lade Übungen...</p>
    <p v-else-if="error" class="text-danger">Fehler: {{ error }}</p>

    <div v-else class="row g-4">
      <div class="col-12" v-for="ex in exercises" :key="ex.id">
        <div class="card mx-auto exercise-card">
          <div class="card-body">
            <h5 class="card-title">{{ ex.name }}</h5>
            <p class="card-text"><strong>Muskelgruppe:</strong> {{ ex.muskelgruppe }}</p>
          </div>
        </div>
      </div>
    </div>

    <p v-if="!isLoading && exercises.length === 0" class="mt-3">Keine Übungen gefunden.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Exercise {
  id: number
  name: string
  muskelgruppe: string
}

const exercises = ref<Exercise[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

const loadExercises = async () => {
  try {
    isLoading.value = true
    error.value = null

    const baseUrl = import.meta.env.VITE_BACKEND_BASE_URL ?? ''
    const response = await fetch(`${baseUrl}/api/exercises`)

    if (!response.ok) {
      error.value = `HTTP-Fehler: ${response.status}`
      return
    }

    exercises.value = await response.json()
  } catch (e: any) {
    console.error(e)
    error.value = e?.message ?? 'Unbekannter Fehler'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadExercises)
</script>

<style scoped>
.container { padding-top: 1rem; }
/* Breitere, längere Karten; zentriert innerhalb des Containers */
.exercise-card {
  width: 100%;
  max-width: 900px; /* passt die maximale Breite an */
}
.exercise-card .card-body {
  min-height: 5rem; /* macht die Karte höher */
}
</style>
