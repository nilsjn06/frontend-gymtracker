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

const loadExercises = async () => {
  try {
    isLoading.value = true
    error.value = null

    const baseUrl = import.meta.env.VITE_BACKEND_BASE_URL
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
  </section>
</template>

<style scoped>
.error {
  color: red;
}
</style>
