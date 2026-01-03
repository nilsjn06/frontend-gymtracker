<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as api from '@/services/api'
import { useRouter } from 'vue-router'

interface WorkoutSummary {
  id: number
  date: string
  title?: string
}

const workouts = ref<WorkoutSummary[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

const router = useRouter()

const load = async () => {
  try {
    isLoading.value = true
    error.value = null
    workouts.value = await api.getAllWorkouts()
  } catch (e: any) {
    error.value = e?.message ?? 'Fehler'
  } finally {
    isLoading.value = false
  }
}

onMounted(load)

const startNew = async () => {
  const today = new Date().toISOString().slice(0, 10)
  try {
    const created = await api.createWorkout({ date: today, title: 'Neues Training' })
    router.push({ name: 'workout-detail', params: { id: created.id } })
  } catch (e: any) {
    error.value = e?.message ?? 'Fehler'
  }
}
</script>

<template>
  <section>
    <h2>Workouts</h2>
    <button @click="startNew">Workout starten</button>

    <p v-if="isLoading">Lade …</p>
    <p v-else-if="error" class="error">Fehler: {{ error }}</p>

    <ul v-else>
      <li v-for="w in workouts" :key="w.id">
        <router-link :to="{ name: 'workout-detail', params: { id: w.id } }">
          {{ w.date }} - {{ w.title ?? '—' }}
        </router-link>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.error { color: red }
</style>
