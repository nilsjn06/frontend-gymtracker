<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAllWorkouts, getWorkoutDetails, getAllExercises, deleteWorkout } from '../services/api'

const workouts = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const deleting = ref<Record<string, boolean>>({})

function findNameInObject(obj: any, searchId: any, depth = 0): string | null {
  if (obj == null || depth > 6) return null
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const res = findNameInObject(item, searchId, depth + 1)
      if (res) return res
    }
    return null
  }
  if (typeof obj === 'object') {
    if (
      (obj.id === searchId || String(obj.id) === String(searchId)) &&
      typeof obj.name === 'string' &&
      obj.name.trim() !== ''
    ) return obj.name

    if (
      obj.exercise &&
      (obj.exercise.id === searchId || String(obj.exercise.id) === String(searchId)) &&
      typeof obj.exercise.name === 'string' &&
      obj.exercise.name.trim() !== ''
    ) return obj.exercise.name

    for (const k of Object.keys(obj)) {
      try {
        const res = findNameInObject(obj[k], searchId, depth + 1)
        if (res) return res
      } catch {}
    }
  }
  return null
}

async function handleDelete(workoutId: number) {
  const ok = confirm('Soll dieses Workout wirklich gelöscht werden?')
  if (!ok) return

  deleting.value[String(workoutId)] = true
  try {
    await deleteWorkout(workoutId)
    workouts.value = workouts.value.filter((w: any) => w.id !== workoutId)
  } catch (e: any) {
    alert(`Fehler beim Löschen: ${e?.message ?? e}`)
  } finally {
    deleting.value[String(workoutId)] = false
  }
}

async function loadWorkouts() {
  loading.value = true
  error.value = null
  try {
    const list = await getAllWorkouts()

    // Übungsnamen einmal laden
    let exerciseMap: Record<string, string> = {}
    try {
      const all = await getAllExercises()
      for (const e of all) {
        if (e?.id != null) exerciseMap[String(e.id)] = e.name ?? ''
      }
    } catch {
      exerciseMap = {}
    }

    const detailed: any[] = []
    for (const w of list) {
      try {
        const d = await getWorkoutDetails(w.id)

        let normalizedExercises: any[] = []

        if (Array.isArray(d.exercises) && d.exercises.length > 0) {
          normalizedExercises = d.exercises.map((ex: any) => {
            const exId = ex?.id ?? ex?.exerciseId ?? ex?.exercise?.id ?? null
            const nameFromDto = ex?.name ?? ex?.exercise?.name ?? ex?.exerciseName
            const nameFromMap = exId != null ? exerciseMap[String(exId)] : undefined
            const nameFromRaw = exId != null ? findNameInObject(d, exId) : undefined
            const finalName = nameFromDto ?? nameFromMap ?? nameFromRaw ?? ''

            return {
              id: exId ?? -1,
              name: finalName,
              sets: ex.sets ?? ex.setList ?? [],
            }
          })
        } else if (Array.isArray((d as any).sets) && (d as any).sets.length > 0) {
          const sets = (d as any).sets as any[]
          const byEx = new Map<string | number, any>()

          for (const s of sets) {
            const exId = s.exerciseId ?? s.exercise?.id ?? null
            const exName = s.exerciseName ?? s.exercise?.name
            const key = exId ?? 'unknown'

            if (!byEx.has(key)) {
              const nameFromMap = exId != null ? exerciseMap[String(exId)] : undefined
              const nameFromRaw = exId != null ? findNameInObject(d, exId) : undefined
              byEx.set(key, { id: exId ?? -1, name: exName ?? nameFromMap ?? nameFromRaw ?? '', sets: [] })
            }

            byEx.get(key).sets.push({ id: s.id ?? -1, weight: s.weight ?? 0, reps: s.reps ?? 0 })
          }

          normalizedExercises = Array.from(byEx.values())
        } else {
          normalizedExercises = []
        }

        detailed.push({ id: d.id, date: d.date, title: d.title, exercises: normalizedExercises })
      } catch {
        detailed.push({ id: w.id, date: w.date, title: w.title, exercises: [] })
      }
    }

    workouts.value = detailed.sort((a, b) => b.date.localeCompare(a.date))
  } catch (e: any) {
    error.value = e?.message ?? 'Fehler beim Laden der Workouts'
  } finally {
    loading.value = false
  }
}

onMounted(() => void loadWorkouts())
</script>

<template>
  <div class="container py-3 workout-history">
    <h1 class="mb-3">Workoutverlauf</h1>

    <div v-if="loading" class="my-3">Lade Workouts...</div>
    <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>

    <div v-if="!loading && workouts.length === 0" class="alert alert-secondary">
      Keine Workouts gefunden.
    </div>

    <!-- WICHTIG: w-100, damit Row nicht zusammenschrumpft (bei flex-centering parents) -->
    <div class="row gy-3 w-100">
      <div class="col-12 col-md-6" v-for="workout in workouts" :key="workout.id">
        <div class="card h-100 workout-card">
          <div class="card-body">
            <!-- HEADER FIX: min-width:0 + truncate + wrap + gap -->
            <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
              <div class="header-left">
                <h5 class="card-title mb-0 text-truncate">{{ workout.title }}</h5>
                <small class="text-muted">{{ workout.date }}</small>
              </div>

              <div class="flex-shrink-0">
                <span class="badge bg-primary text-nowrap">
                  {{ workout.exercises.length }} Übung(en)
                </span>
              </div>
            </div>

            <div v-if="workout.exercises.length === 0" class="mt-3">
              <div class="text-muted">Keine Übungen für dieses Workout vorhanden.</div>
            </div>

            <div v-else class="mt-3">
              <div v-for="ex in workout.exercises" :key="ex.id" class="mb-3">
                <!-- WICHTIG: table-responsive verhindert “rauslaufen” -->
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
                      <td colspan="3" class="table-primary text-white fw-bold">
                        {{
                          ex.name && ex.name !== ''
                            ? ex.name
                            : (ex.id && ex.id !== -1 ? `Übung ${ex.id}` : 'Unbenannte Übung')
                        }}
                      </td>
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
                :disabled="deleting[String(workout.id)]"
              >
                <span
                  v-if="deleting[String(workout.id)]"
                  class="spinner-border spinner-border-sm me-1"
                  role="status"
                  aria-hidden="true"
                ></span>
                Löschen
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Fix 1: Wenn ein Parent "align-items:center" nutzt, schrumpft die Row sonst zusammen */
.workout-history .row {
  width: 100%;
}

/* Fix 2: Card soll Inhalte nicht “rausbluten” lassen */
.workout-card {
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.header-left {
  min-width: 0;     /* wichtig für text-truncate im Flex */
  flex: 1 1 auto;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
