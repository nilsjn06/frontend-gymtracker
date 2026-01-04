<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAllExercises, addSetToWorkout, getWorkout } from '../services/api'
import type { ExerciseDto } from '../services/api'

const route = useRoute()
const router = useRouter()
const workoutId = route.params.id as string

const exercises = ref<ExerciseDto[]>([])
const loadingExercises = ref(false)
const modalOpen = ref(false)
const selectedExercise = ref<ExerciseDto | null>(null)

// sets for the currently selected exercise
type SetRow = { reps: number | null; weight: number | null }
const sets = ref<SetRow[]>([])

// list of added exercises locally
const addedExercises = ref<Array<{ exercise: ExerciseDto; sets: SetRow[] }>>([])
const saving = ref(false)
const error = ref<string | null>(null)

const workoutTitle = ref<string | null>(null)
const displayTitle = computed(() => workoutTitle.value ?? `Workout ${workoutId}`)

async function loadWorkout() {
  try {
    const w = await getWorkout(workoutId!)
    workoutTitle.value = w.title ?? `Workout ${w.id}`
  } catch (e: any) {
    // ignore or set fallback
    workoutTitle.value = `Workout ${workoutId}`
  }
}

async function loadExercises() {
  loadingExercises.value = true
  try {
    exercises.value = await getAllExercises()
  } catch (e: any) {
    error.value = e.message ?? 'Fehler beim Laden der Übungen'
  } finally {
    loadingExercises.value = false
  }
}

function openModal() {
  error.value = null
  modalOpen.value = true
  if (exercises.value.length === 0) {
    loadExercises()
  }
}

function selectExercise(ex: ExerciseDto) {
  selectedExercise.value = ex
  // initialisiere mit einem Satz
  sets.value = [{ reps: null, weight: null }]
  modalOpen.value = false
}

function addSetRow() {
  sets.value.push({ reps: null, weight: null })
}

function removeSetRow(index: number) {
  sets.value.splice(index, 1)
}

async function finishExercise() {
  if (!selectedExercise.value) return
  error.value = null
  saving.value = true
  try {
    // sende jeden Satz an das Backend
    for (const s of sets.value) {
      if (s.reps == null || s.weight == null) continue // überspringe unvollständige Reihen
      await addSetToWorkout(workoutId!, {
        exerciseId: selectedExercise.value.id,
        reps: s.reps,
        weight: s.weight,
      })
    }

    // lokal speichern (für UI)
    addedExercises.value.push({ exercise: selectedExercise.value, sets: JSON.parse(JSON.stringify(sets.value)) })

    // reset
    selectedExercise.value = null
    sets.value = []
  } catch (e: any) {
    error.value = e.message ?? 'Fehler beim Hinzufügen der Sätze'
  } finally {
    saving.value = false
  }
}

function endWorkout() {
  // entferne laufende Workout-ID
  localStorage.removeItem('currentWorkoutId')
  // ggf. hier noch abschließende Aktionen durchführen
  router.push('/workout-history')
}

onMounted(() => {
  console.log('WorkoutSets mounted for workout', workoutId)
  loadWorkout()
})
</script>

<template>
  <div class="container">
    <h1>Workout</h1>
    <p>Übungen zu "{{ displayTitle }}" hinzufügen</p>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <!-- bereits hinzugefügte Übungen -->
    <div v-if="addedExercises.length">
      <h5>Hinzugefügte Übungen</h5>
      <div v-for="(ae, idx) in addedExercises" :key="ae.exercise.id + '-' + idx" class="mb-3">
        <div class="card">
          <div class="card-body">
            <h6 class="card-title">{{ ae.exercise.name }}</h6>
            <ul class="list-group list-group-flush">
              <li v-for="(s, i) in ae.sets" :key="i" class="list-group-item">
                Satz {{ i + 1 }} — {{ s.reps ?? '-' }} Wdh. — {{ s.weight ?? '-' }} kg
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Wenn keine Übung ausgewählt ist: Button, um eine auszuwählen -->
    <div v-if="!selectedExercise">
      <button class="btn btn-primary" @click="openModal">Übung hinzufügen</button>
    </div>

    <!-- Wenn Übung ausgewählt ist: zeige Formular für Sätze -->
    <div v-else class="mt-3">
      <div class="card mb-3">
        <div class="card-body">
          <h5>{{ selectedExercise.name }}</h5>

          <div v-for="(s, i) in sets" :key="i" class="d-flex gap-2 align-items-end mb-2">
            <div class="flex-grow-1">
              <label class="form-label">Wiederholungen</label>
              <input type="number" min="0" class="form-control" v-model.number="s.reps" />
            </div>
            <div class="flex-grow-1">
              <label class="form-label">Gewicht (kg)</label>
              <input type="number" step="0.5" min="0" class="form-control" v-model.number="s.weight" />
            </div>
            <div>
              <button type="button" class="btn btn-outline-danger btn-sm" @click.prevent="removeSetRow(i)">-</button>
            </div>
          </div>

          <div class="d-flex gap-2">
            <button type="button" class="btn btn-outline-primary btn-sm" @click.prevent="addSetRow">+ Satz</button>
            <button type="button" class="btn btn-success btn-sm" @click.prevent="finishExercise" :disabled="saving">
              {{ saving ? 'Speichere...' : 'Übung fertig' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal (einfacher, mit Bootstrap classes). Wir verwenden v-if für Anzeige. -->
    <div v-if="modalOpen" class="modal d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Übung auswählen</h5>
            <button type="button" class="btn-close" aria-label="Close" @click="modalOpen = false"></button>
          </div>
          <div class="modal-body">
            <div v-if="loadingExercises">Lade Übungen...</div>
            <div v-else>
              <ul class="list-group">
                <li v-for="ex in exercises" :key="ex.id" class="list-group-item list-group-item-action" @click="selectExercise(ex)" style="cursor:pointer">
                  <div class="d-flex justify-content-between">
                    <div>{{ ex.name }}</div>
                    <small class="text-muted">{{ ex.muskelgruppe ?? '' }}</small>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="modalOpen = false">Abbrechen</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Button zum Beenden des Workouts -->
    <div class="mt-4">
      <button class="btn btn-danger" @click="endWorkout">Workout beenden</button>
    </div>

  </div>
</template>

<style scoped>
.container { padding: 1rem; }
/* Modal background */
.modal { background: rgba(0,0,0,0.5); }
</style>
