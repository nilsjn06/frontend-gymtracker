import { ref, onMounted } from 'vue'
import { getAllWorkouts, getWorkoutDetails, getAllExercises, deleteWorkout } from '../services/api'

export function useWorkoutHistory() {
  const workouts = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const deleting = ref<Record<string, boolean>>({})

  function getDisplayName(ex: any): string {
    try {
      const raw = ex?.name ?? ''
      const trimmed = String(raw).trim()
      if (trimmed.length > 0) return trimmed
      if (ex?.id != null && ex.id !== -1) return `Übung ${ex.id}`
      return 'Unbenannte Übung'
    } catch {
      return 'Unbenannte Übung'
    }
  }

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

              const rawSets = ex.sets ?? ex.setList ?? []
              const normalizedSets = Array.isArray(rawSets)
                ? rawSets.map((s: any) => ({ id: s.id ?? s.satz ?? -1, weight: s.weight ?? s.kg ?? 0, reps: s.reps ?? 0 }))
                : []

              return {
                id: exId ?? -1,
                name: finalName,
                sets: normalizedSets,
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

              byEx.get(key).sets.push({ id: s.id ?? -1, weight: s.weight ?? s.kg ?? 0, reps: s.reps ?? 0 })
            }

            normalizedExercises = Array.from(byEx.values())
          } else {
            normalizedExercises = []
          }

          console.log('WorkoutHistory: loaded exercises for workout', d.id, normalizedExercises.map((ne: any) => ({ id: ne.id, name: ne.name })))

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

  return {
    workouts,
    loading,
    error,
    deleting,
    getDisplayName,
    handleDelete,
  }
}

