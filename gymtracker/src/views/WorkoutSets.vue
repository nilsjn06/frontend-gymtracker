<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAllExercises, addSetToWorkout, getWorkout, removeExerciseFromWorkout, createExercise } from '../services/api'
import type { ExerciseDto } from '../services/api'

const route = useRoute()
const router = useRouter()
const workoutId = route.params.id as string

const exercises = ref<ExerciseDto[]>([])
const loadingExercises = ref(false)
const modalOpen = ref(false)
const selectedExercise = ref<ExerciseDto | null>(null)

// --- neue States für "Neue Übung" ---
const createMode = ref(false)
const newExerciseForm = ref({ name: '', muskelgruppe: 'BRUST' })
const creatingExercise = ref(false)
const createError = ref<string | null>(null)
// --------------------------------------

// sets for the currently selected exercise
type SetRow = { reps: number | null; weight: number | null }
const sets = ref<SetRow[]>([])

// list of added exercises locally
const addedExercises = ref<Array<{ exercise: ExerciseDto; sets: SetRow[] }>>([])
const saving = ref(false)
const error = ref<string | null>(null)
const removingExercise = ref(false)

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
  createMode.value = false
  createError.value = null
  if (exercises.value.length === 0) {
    loadExercises()
  }
}

// neue Funktion: erstelle Übung via API und lade Liste neu
async function saveNewExercise() {
  createError.value = null
  if (!newExerciseForm.value.name || !newExerciseForm.value.name.trim()) {
    createError.value = 'Bitte einen Namen für die Übung eingeben.'
    return
  }

  creatingExercise.value = true
  try {
    const payload = { name: newExerciseForm.value.name.trim(), muskelgruppe: newExerciseForm.value.muskelgruppe }
    const created = await createExercise(payload)

    // lade Übungen neu und wähle das neu erstellte automatisch
    await loadExercises()
    const found = exercises.value.find(e => e.id === created.id)
    if (found) {
      selectExercise(found)
    } else {
      // fallback: wähle das erste
      if (exercises.value.length > 0) selectExercise(exercises.value[0])
    }

    // reset create form
    newExerciseForm.value = { name: '', muskelgruppe: 'BRUST' }
    createMode.value = false
  } catch (e: any) {
    createError.value = e?.message ?? 'Fehler beim Erstellen der Übung'
  } finally {
    creatingExercise.value = false
  }
}

function selectExercise(ex: ExerciseDto | undefined) {
  if (!ex) return
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

// --- Input validation / sanitization handlers ---
// Reps (WHD): only digits, max 4 digits, no decimals
function onRepsInput(e: Event, s: SetRow) {
  const input = e.target as HTMLInputElement
  let raw = input.value || ''
  // remove non-digit characters
  raw = raw.replace(/\D+/g, '')
  // limit to 4 digits
  if (raw.length > 4) raw = raw.slice(0, 4)
  // update model
  s.reps = raw === '' ? null : parseInt(raw, 10)
  // reflect sanitized value in the input element
  input.value = raw
}

// Weight (KG): allow digits and one decimal point, normalize comma to dot,
// integer part max 3 digits, no letters
function onWeightInput(e: Event, s: SetRow) {
  const input = e.target as HTMLInputElement
  let raw = input.value || ''
  // normalize comma to dot
  raw = raw.replace(/,/g, '.')
  // remove anything except digits and dot
  raw = raw.replace(/[^0-9.]/g, '')
  // keep only first dot
  const parts = raw.split('.')
  if (parts.length > 1) {
    raw = parts[0] + '.' + parts.slice(1).join('')
  }
  // enforce max 3 digits for integer part
  let [intPart, decPart] = raw.split('.')
  if (!intPart) intPart = ''
  if (intPart.length > 3) intPart = intPart.slice(0, 3)
  if (decPart !== undefined) {
    // limit decimals to at most 2 digits to be reasonable
    decPart = decPart.slice(0, 2)
    raw = intPart + '.' + decPart
  } else {
    raw = intPart
  }
  s.weight = raw === '' ? null : parseFloat(raw)
  input.value = raw
}
// ------------------------------------------------

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

async function removeExercise(exerciseId: number) {
  error.value = null
  removingExercise.value = true
  try {
    // rufe Backend an, das alle Sätze dieser Übung im Workout löscht
    const updated = await removeExerciseFromWorkout(workoutId!, exerciseId)
    // aktualisiere lokal: baue addedExercises neu aus dem zurückgegebenen WorkoutViewDto falls vorhanden
    if (updated && updated.exercises) {
      // mappe die Struktur: updated.exercises enthält exerciseName, exerciseId, sets
      addedExercises.value = updated.exercises.map((e: any) => ({ exercise: { id: e.exerciseId, name: e.exerciseName, muskelgruppe: null }, sets: e.sets.map((s: any) => ({ reps: s.reps, weight: s.kg })) }))
    } else {
      // fallback: filter lokal
      addedExercises.value = addedExercises.value.filter(ae => ae.exercise.id !== exerciseId)
    }
  } catch (e: any) {
    error.value = e.message ?? 'Fehler beim Entfernen der Übung'
  } finally {
    removingExercise.value = false
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
            <div class="mb-2 text-end">
              <button class="btn btn-sm btn-outline-danger" @click="removeExercise(ae.exercise.id)" :disabled="removingExercise">Aus Workout entfernen</button>
            </div>
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
              <input type="number" min="0" class="form-control" v-model.number="s.reps" @input="onRepsInput($event, s)" inputmode="numeric" pattern="[0-9]*" />
            </div>
            <div class="flex-grow-1">
              <label class="form-label">Gewicht (kg)</label>
              <input type="number" step="0.5" min="0" class="form-control" v-model.number="s.weight" @input="onWeightInput($event, s)" inputmode="decimal" />
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
              <div v-if="!createMode">
                <ul class="list-group">
                  <li v-for="ex in exercises" :key="ex.id" class="list-group-item list-group-item-action" @click="selectExercise(ex)" style="cursor:pointer">
                    <div class="d-flex justify-content-between">
                      <div>{{ ex.name }}</div>
                      <small class="text-muted">{{ ex.muskelgruppe ?? '' }}</small>
                    </div>
                  </li>
                </ul>
              </div>

              <div v-else>
                <div class="mb-3">
                  <label class="form-label">Name <span class="text-danger">*</span></label>
                  <input v-model="newExerciseForm.name" type="text" class="form-control" placeholder="z. B. Bankdrücken" />
                </div>
                <div class="mb-3">
                  <label class="form-label">Muskelgruppe</label>
                  <select v-model="newExerciseForm.muskelgruppe" class="form-select">
                    <option>BRUST</option>
                    <option>RUECKEN</option>
                    <option>BEINE</option>
                    <option>SCHULTERN</option>
                    <option>BIZEPS</option>
                    <option>TRIZEPS</option>
                    <option>BAUCH</option>
                  </select>
                </div>
                <p v-if="createError" class="text-danger">{{ createError }}</p>
              </div>

            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="modalOpen = false">Abbrechen</button>
            <template v-if="!createMode">
              <button type="button" class="btn btn-outline-primary" @click="createMode = true">Neue Übung</button>
            </template>
            <template v-else>
              <button type="button" class="btn btn-secondary" @click="createMode = false">Zurück</button>
              <button type="button" class="btn btn-success" @click="saveNewExercise" :disabled="creatingExercise">{{ creatingExercise ? 'Speichere...' : 'Erstellen' }}</button>
            </template>
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
