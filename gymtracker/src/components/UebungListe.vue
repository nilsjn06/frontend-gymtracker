<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Uebung from './Uebung.vue'

interface Exercise {
  id: number
  name: string
  muskelgruppe: string // kommt als Enum-String aus Spring
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

<template>
  <section>
    <h2>Übungen</h2>

    <p v-if="isLoading">Lade Übungen...</p>
    <p v-else-if="error" class="error">Fehler: {{ error }}</p>

    <ul v-else>
      <li v-for="ex in exercises" :key="ex.id">
        <Uebung :id="ex.id" :name="ex.name" :muskelgruppe="ex.muskelgruppe" />
      </li>
    </ul>
  </section>
</template>

<style scoped>
.error {
  color: red;
}
</style>
