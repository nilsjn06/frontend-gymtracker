<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Exercise {
  name: string
  muskelgruppe: string
  satz: number
  wiederholungen: number
  gewicht: number
}

const exercises = ref<Exercise[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// minimalistische Test-Inputs
const newName = ref('Bankdrücken')
const newMuskelgruppe = ref('BRUST')
const workoutTitle = ref('Test-Workout')

const baseUrl = import.meta.env.VITE_BACKEND_BASE_URL

const loadExercises = async () => {
  try {
    isLoading.value = true
    error.value = null

    const response = await fetch(`${baseUrl}/api/exercises`)

    if (!response.ok) {
      throw new Error(`HTTP-Fehler: ${response.status}`)
    }

    exercises.value = await response.json()
  } catch (e: any) {
    console.error(e)
    error.value = e?.message ?? 'Unbekannter Fehler'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadExercises()
})

// Kleine Test-Methode: Übung anlegen
const createExercise = async () => {
  try {
    isLoading.value = true
    error.value = null

    const payload = {
      name: newName.value,
      muskelgruppe: newMuskelgruppe.value
    }

    const response = await fetch(`${baseUrl}/api/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`HTTP-Fehler: ${response.status}`)
    }

    // neu laden für schnellen Test
    newName.value = ''
    await loadExercises()
  } catch (e: any) {
    console.error(e)
    error.value = e?.message ?? 'Unbekannter Fehler'
  } finally {
    isLoading.value = false
  }
}

// Kleine Test-Methode: Workout sofort starten (heutiges Datum)
const startWorkout = async () => {
  try {
    isLoading.value = true
    error.value = null

    const date = new Date().toISOString().slice(0, 10) // yyyy-MM-dd
    const payload = {
      date,
      title: workoutTitle.value
    }

    const response = await fetch(`${baseUrl}/api/workouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`HTTP-Fehler: ${response.status}`)
    }

    const created = await response.json()
    console.log('Workout erstellt:', created)
  } catch (e: any) {
    console.error(e)
    error.value = e?.message ?? 'Unbekannter Fehler'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <section>
    <h2>Übungen</h2>

    <p v-if="isLoading">Lade Übungen...</p>
    <p v-else-if="error" class="error">Fehler: {{ error }}</p>

    <ul v-else>
      <li v-for="ex in exercises" :key="ex.name">
        <strong>{{ ex.name }}</strong>
        – {{ ex.muskelgruppe }}
        ({{ ex.satz }}×{{ ex.wiederholungen }} mit {{ ex.gewicht }} kg)
      </li>
    </ul>

    <!-- Minimalistische Test-UI -->
    <div class="test-area">
      <h3>Test: Übung hinzufügen</h3>
      <label>
        Name: <input v-model="newName" placeholder="Übungsname" />
      </label>
      <label>
        Muskelgruppe:
        <select v-model="newMuskelgruppe">
          <option>BRUST</option>
          <option>RUECKEN</option>
          <option>BEINE</option>
          <option>SCHULTERN</option>
          <option>BIZEPS</option>
          <option>TRIZEPS</option>
          <option>BAUCH</option>
        </select>
      </label>
      <button @click="createExercise">Übung erstellen (Test)</button>

      <h3>Test: Workout starten</h3>
      <label>
        Titel: <input v-model="workoutTitle" placeholder="z.B. Push" />
      </label>
      <button @click="startWorkout">Workout starten (heute)</button>
    </div>
  </section>
</template>

<style scoped>
.error {
  color: red;
}
.test-area {
  margin-top: 1rem;
  padding: 0.5rem;
  border-top: 1px dashed var(--color-border);
}
.test-area label { display: block; margin: 0.25rem 0; }
</style>
