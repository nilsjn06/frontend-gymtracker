<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as api from '@/services/api'

const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)

const workout = ref<any | null>(null)
const exercises = ref<any[]>([])
const availableExercises = ref<any[]>([])

const isLoading = ref(false)
const error = ref<string | null>(null)

const load = async () => {
  try {
    isLoading.value = true
    error.value = null
    workout.value = await api.getWorkout(id)
    exercises.value = workout.value?.exercises || []
    availableExercises.value = await api.getExercises()
  } catch (e: any) {
    error.value = e?.message ?? 'Fehler'
  } finally {
    isLoading.value = false
  }
}

onMounted(load)

// UI state for adding new exercise
const showAddExercise = ref(false)
const newExerciseName = ref('')
const newExerciseGroup = ref('BRUST')

const addNewExercise = async () => {
  try {
    const created = await api.createExercise({
      name: newExerciseName.value,
      muskelgruppe: newExerciseGroup.value,
    })
    // add first set automatically
    await api.addSetToWorkout(id, { exerciseId: created.id, weight: 0, reps: 0 })
    newExerciseName.value = ''
    showAddExercise.value = false
    await load()
  } catch (e: any) {
    error.value = e?.message ?? 'Fehler'
  }
}

const addExistingExercise = async (exerciseId: number) => {
  try {
    await api.addSetToWorkout(id, { exerciseId, weight: 0, reps: 0 })
    await load()
  } catch (e: any) {
    error.value = e?.message ?? 'Fehler'
  }
}

const addSet = async (exerciseId: number) => {
  try {
    await api.addSetToWorkout(id, { exerciseId, weight: 0, reps: 0 })
    await load()
  } catch (e: any) {
    error.value = e?.message ?? 'Fehler'
  }
}

const updateSet = async (workoutId: number, exerciseId: number, setIndex: number, weight: number, reps: number) => {
  // Backend doesn't offer edit-set; we simulate by adding a new set with the provided values.
  try {
    await api.addSetToWorkout(workout.value.id, { exerciseId, weight, reps })
    await load()
  } catch (e: any) {
    error.value = e?.message ?? 'Fehler'
  }
}

const finish = () => {
  router.push({ name: 'workouts' })
}
</script>

<template>
  <section>
    <h2>Workout</h2>

    <p v-if="isLoading">Lade …</p>
    <p v-else-if="error" class="error">Fehler: {{ error }}</p>

    <div v-else>
      <h3>{{ workout?.date }} — {{ workout?.title }}</h3>

      <div v-if="exercises.length === 0">
        <p>Keine Übungen. Füge eine Übung hinzu.</p>
      </div>

      <div v-for="ex in exercises" :key="ex.exerciseId" class="exercise">
        <h4>{{ ex.exerciseName }}</h4>
        <ul>
          <li v-for="(s, idx) in ex.sets" :key="idx">
            Satz {{ s.satz }} —
            <input type="number" :value="s.kg" @input="(e) => (s.kg = parseFloat((e.target as HTMLInputElement).value) || 0)" /> kg
            <input type="number" :value="s.reps" @input="(e) => (s.reps = parseInt((e.target as HTMLInputElement).value) || 0)" /> reps
            <button @click="() => updateSet(workout.id, ex.exerciseId, idx, s.kg, s.reps)">Speichern (als neuer Satz)</button>
          </li>
        </ul>
        <button @click="() => addSet(ex.exerciseId)">+</button>
      </div>

      <hr />

      <div>
        <button @click="showAddExercise = !showAddExercise">Neue Übung</button>
        <div v-if="showAddExercise" class="add-box">
          <h4>Voreingestellte Übungen</h4>
          <ul>
            <li v-for="ae in availableExercises" :key="ae.id">
              {{ ae.name }} ({{ ae.muskelgruppe }})
              <button @click="() => addExistingExercise(ae.id)">Hinzufügen</button>
            </li>
          </ul>

          <h4>Oder eigene Übung</h4>
          <input v-model="newExerciseName" placeholder="Name" />
          <select v-model="newExerciseGroup">
            <option>BRUST</option>
            <option>RUECKEN</option>
            <option>BEINE</option>
            <option>SCHULTERN</option>
            <option>BIZEPS</option>
            <option>TRIZEPS</option>
            <option>BAUCH</option>
          </select>
          <button @click="addNewExercise">Erstellen & ersten Satz hinzufügen</button>
        </div>
      </div>

      <hr />
      <button @click="finish">Workout beenden</button>
    </div>
  </section>
</template>

<style scoped>
.exercise { border: 1px solid #ddd; padding: 8px; margin-bottom: 8px }
.add-box { margin-top: 8px; padding: 8px; border: 1px dashed #ccc }
.error { color: red }
</style>
