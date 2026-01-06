<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAllWorkouts, getWorkoutDetails, getAllExercises, deleteWorkout, WorkoutDetailDto, WorkoutViewDto } from '../services/api'

// Wechsel zu any[] um Debug-Felder (raw/showRaw) sicher zu handhaben
const workouts = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// lokale Map für Löschzustand pro Workout (string keys)
const deleting = ref<Record<string, boolean>>({})

// Hilfsfunktion: rekursiv durchsucht ein Objekt/Array nach einem Objekt mit id===searchId und einem name-Feld
function findNameInObject(obj: any, searchId: any, depth = 0): string | null {
  if (obj == null || depth > 6) return null // stoppe zu tiefe Rekursion
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const res = findNameInObject(item, searchId, depth + 1)
      if (res) return res
    }
    return null
  }
  if (typeof obj === 'object') {
    // direkte Übereinstimmung
    if ((obj.id === searchId || String(obj.id) === String(searchId)) && typeof obj.name === 'string' && obj.name.trim() !== '') return obj.name
    // gelegentlich haben Objekte wie { exercise: { id, name } }
    if (obj.exercise && (obj.exercise.id === searchId || String(obj.exercise.id) === String(searchId)) && typeof obj.exercise.name === 'string' && obj.exercise.name.trim() !== '') return obj.exercise.name
    // tiefer untersuchen
    for (const k of Object.keys(obj)) {
      try {
        const res = findNameInObject(obj[k], searchId, depth + 1)
        if (res) return res
      } catch (e) {
        // ignore
      }
    }
  }
  return null
}

async function handleDelete(workoutId: number) {
  const ok = confirm('Soll dieses Workout wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden.')
  if (!ok) return
  deleting.value[String(workoutId)] = true
  try {
    await deleteWorkout(workoutId)
    // entferne aus Liste
    workouts.value = workouts.value.filter((w: any) => w.id !== workoutId)
  } catch (e: any) {
    alert(`Fehler beim Löschen: ${e.message ?? e}`)
  } finally {
    deleting.value[String(workoutId)] = false
  }
}

// Lade alle Workouts und ihre Details
async function loadWorkouts() {
  loading.value = true
  error.value = null
  try {
    const list = await getAllWorkouts()

    // Lade alle bekannten Übungen einmal und baue eine id->name Map (string keys)
    let exerciseMap: Record<string, string> = {}
    try {
      const all = await getAllExercises()
      for (const e of all) {
        if (e && e.id != null) {
          exerciseMap[String(e.id)] = e.name ?? ''
        }
      }
    } catch (e) {
      // Wenn das Laden der Übungen fehlschlägt, fahren wir trotzdem fort
      exerciseMap = {}
    }

    // Hole Details einzeln (Backend liefert evtl. nur kurze DTOs)
    const detailed: any[] = []
    for (const w of list) {
      try {
        const d = await getWorkoutDetails(w.id)
        // Normalisiere die Übungen: falls name fehlt, versuche ihn aus der Map zu holen
        let normalizedExercises: any[] = []

        // Case A: Backend provides grouped exercises
        if (Array.isArray(d.exercises) && d.exercises.length > 0) {
          normalizedExercises = d.exercises.map((ex: any) => {
            const exId = (ex && (ex.id ?? ex.exerciseId ?? ex.exercise?.id)) ?? null
            const nameFromDto = ex?.name ?? ex?.exercise?.name ?? ex?.exerciseName
            const nameFromMap = exId != null ? (exerciseMap[String(exId)]) : undefined
            const nameFromRaw = exId != null ? findNameInObject(d, exId) : undefined
            const finalName = nameFromDto ?? nameFromMap ?? nameFromRaw ?? ''
            return {
              id: exId ?? -1,
              name: finalName,
              sets: ex.sets ?? ex.setList ?? [],
            }
          })
        }

        // Case B: Backend returns flat sets at workout level -> gruppiere nach exerciseId
        else if (Array.isArray((d as any).sets) && (d as any).sets.length > 0) {
          const sets = (d as any).sets as any[]
          const byEx = new Map<string | number, any>()
          for (const s of sets) {
            const exId = s.exerciseId ?? s.exercise?.id ?? null
            const exName = s.exerciseName ?? s.exercise?.name
            const key = exId ?? 'unknown'
            if (!byEx.has(key)) {
              const nameFromMap = exId != null ? (exerciseMap[String(exId)]) : undefined
              const nameFromRaw = exId != null ? findNameInObject(d, exId) : undefined
              byEx.set(key, { id: exId ?? -1, name: exName ?? nameFromMap ?? nameFromRaw ?? '', sets: [] })
            }
            byEx.get(key).sets.push({ id: s.id ?? -1, weight: s.weight ?? 0, reps: s.reps ?? 0 })
          }
          normalizedExercises = Array.from(byEx.values())
        }

        // Case C: fallback - no exercises/sets
        else {
          normalizedExercises = []
        }

        // Speichere die normalisierten Daten (ohne Rohdaten-Debugfelder)
        detailed.push({ id: d.id, date: d.date, title: d.title, exercises: normalizedExercises })
      } catch (e: any) {
        // Falls Detail-Laden fehlschlägt, fülle mit Basisdaten
        detailed.push({ id: w.id, date: w.date, title: w.title, exercises: [] })
      }
    }
    // Sortiere nach Datum absteigend (neuestes zuerst)
    workouts.value = detailed.sort((a, b) => b.date.localeCompare(a.date))
  } catch (e: any) {
    error.value = e.message ?? 'Fehler beim Laden der Workouts'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadWorkouts()
})
</script>

<template>
  <div class="container py-3">
    <h1>Workoutverlauf</h1>

    <div v-if="loading" class="my-3">Lade Workouts...</div>
    <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>

    <div v-if="!loading && workouts.length === 0" class="alert alert-secondary">
      Keine Workouts gefunden.
    </div>

    <div class="row gy-3">
      <div class="col-12 col-md-6" v-for="workout in workouts" :key="workout.id">
        <div class="card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h5 class="card-title mb-0">{{ workout.title }}</h5>
                <small class="text-muted">{{ workout.date }}</small>
              </div>
              <div>
                <span class="badge bg-primary">{{ workout.exercises.length }} Übung(en)</span>
              </div>
            </div>

            <div v-if="workout.exercises.length === 0" class="mt-3">
              <div class="text-muted">Keine Übungen für dieses Workout vorhanden.</div>
            </div>

            <div v-else class="mt-3">
              <div v-for="ex in workout.exercises" :key="ex.id" class="mb-3">
                <div class="table-responsive">
                  <table class="table table-sm mb-0">
                    <thead>
                      <tr>
                        <th>Satz</th>
                        <th>Gewicht (kg)</th>
                        <th>Wiederh.</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colspan="3" class="table-primary text-white fw-bold fs-6">{{ ex.name && ex.name !== '' ? ex.name : (ex.id && ex.id !== -1 ? `Übung ${ex.id}` : 'Unbenannte Übung') }}</td>
                      </tr>
                      <tr v-for="(s, idx) in ex.sets" :key="s.id">
                        <td>{{ idx + 1 }}</td>
                        <td>{{ s.weight }}</td>
                        <td>{{ s.reps }}</td>
                      </tr>
                      <tr v-if="ex.sets.length === 0">
                        <td colspan="3" class="text-muted">Keine Sätze vorhanden</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div class="mt-3">
              <button
                class="btn btn-danger btn-sm"
                @click="handleDelete(workout.id)"
                :disabled="deleting[workout.id]"
              >
                <span v-if="deleting[workout.id]" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Löschen
              </button>
            </div>

            <!-- Rohdaten-UI entfernt -->

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container { padding: 1rem; }
.card { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
</style>
