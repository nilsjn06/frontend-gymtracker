import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAllExercises, addSetToWorkout, getWorkout, removeExerciseFromWorkout, createExercise } from '../services/api.ts'

export type ExerciseDto = { id: number; name: string; muskelgruppe?: string | null }

export function useWorkoutSets() {
  const route = useRoute()
  const router = useRouter()
  const workoutId = route.params.id as string

  const exercises = ref<ExerciseDto[]>([])
  const muskelgruppen = ['BRUST','RUECKEN','BEINE','SCHULTERN','BIZEPS','TRIZEPS','BAUCH']
  const selectedGroup = ref<string>('ALL')
  const filteredExercises = computed(() => {
    if (selectedGroup.value === 'ALL') return exercises.value
    return exercises.value.filter(e => (e.muskelgruppe ?? '').toUpperCase() === selectedGroup.value)
  })
  const loadingExercises = ref(false)
  const modalOpen = ref(false)
  const selectedExercise = ref<ExerciseDto | null>(null)

  const createMode = ref(false)
  const newExerciseForm = ref({ name: '', muskelgruppe: 'BRUST' })
  const creatingExercise = ref(false)
  const createError = ref<string | null>(null)

  type SetRow = { reps: number | null; weight: number | null }
  const sets = ref<SetRow[]>([])

  const addedExercises = ref<Array<{ exercise: ExerciseDto; sets: SetRow[] }>>([])
  const saving = ref(false)
  const error = ref<string | null>(null)
  const removingExercise = ref(false)

  const workoutTitle = ref<string | null>(null)

  async function loadWorkout() {
    try {
      const w = await getWorkout(workoutId!)
      workoutTitle.value = w.title ?? `Workout ${w.id}`
    } catch (e: any) {
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

  async function saveNewExercise() {
    createError.value = null
    if (!newExerciseForm.value.name || !newExerciseForm.value.name.trim()) {
      createError.value = 'Bitte einen Namen für die Übung eingeben.'
      return
    }

    const nameTrimmed = newExerciseForm.value.name.trim()
    if (nameTrimmed.length > 15) {
      createError.value = 'Der Name darf maximal 15 Zeichen lang sein.'
      return
    }

    creatingExercise.value = true
    try {
      const payload = { name: nameTrimmed, muskelgruppe: newExerciseForm.value.muskelgruppe }
      const created = await createExercise(payload)

      await loadExercises()
      const found = exercises.value.find(e => e.id === created.id)
      if (found) {
        selectExercise(found)
      } else {
        if (exercises.value.length > 0) selectExercise(exercises.value[0])
      }

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
    sets.value = [{ reps: null, weight: null }]
    modalOpen.value = false
  }

  function addSetRow() {
    sets.value.push({ reps: null, weight: null })
  }

  function removeSetRow(index: number) {
    sets.value.splice(index, 1)
  }

  function onRepsInput(e: Event, s: any) {
    const input = e.target as HTMLInputElement
    let raw = input.value || ''
    raw = raw.replace(/\D+/g, '')
    if (raw.length > 4) raw = raw.slice(0, 4)
    s.reps = raw === '' ? null : parseInt(raw, 10)
    input.value = raw
    // clear any previous error about missing reps once the user types
    error.value = null
  }

  function onWeightInput(e: Event, s: any) {
    const input = e.target as HTMLInputElement
    let raw = input.value || ''
    const normalized = raw.replace(/,/g, '.')
    let cleaned = normalized.replace(/[^0-9.]/g, '')
    const parts = cleaned.split('.')
    if (parts.length > 1) {
      cleaned = parts[0] + '.' + parts.slice(1).join('')
    }
    let [intPart, decPart] = cleaned.split('.')
    if (!intPart) intPart = ''
    if (intPart.length > 3) intPart = intPart.slice(0, 3)
    if (decPart !== undefined) {
      decPart = decPart.slice(0, 2)
      cleaned = intPart + '.' + decPart
    } else {
      cleaned = intPart
    }
    s.weight = cleaned === '' ? null : parseFloat(cleaned)
    input.value = cleaned === '' ? '' : cleaned.replace('.', ',')
  }

  async function finishExercise() {
    if (!selectedExercise.value) return
    error.value = null

    // validate that every set has reps filled
    const missingReps = sets.value.some(s => s.reps == null)
    if (missingReps) {
      error.value = 'Bitte für alle Sätze die Wiederholungen (Wdh.) angeben.'
      return
    }

    saving.value = true
    try {
      for (const s of sets.value) {
        // since we validated, s.reps is not null
        const weightToSend = s.weight == null ? 0 : s.weight
        await addSetToWorkout(workoutId!, {
          exerciseId: selectedExercise.value.id,
          reps: s.reps!,
          weight: weightToSend,
        })
      }

      // normalize sets so that missing weight becomes 0 when shown in the UI
      const normalizedSets = sets.value.map(s => ({ reps: s.reps, weight: s.weight == null ? 0 : s.weight }))
      addedExercises.value.push({ exercise: selectedExercise.value, sets: JSON.parse(JSON.stringify(normalizedSets)) })

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
      const updated = await removeExerciseFromWorkout(workoutId!, exerciseId)
      if (updated && updated.exercises) {
        addedExercises.value = updated.exercises.map((e: any) => ({ exercise: { id: e.exerciseId, name: e.exerciseName, muskelgruppe: null }, sets: e.sets.map((s: any) => ({ reps: s.reps, weight: s.kg })) }))
      } else {
        addedExercises.value = addedExercises.value.filter(ae => ae.exercise.id !== exerciseId)
      }
    } catch (e: any) {
      error.value = e.message ?? 'Fehler beim Entfernen der Übung'
    } finally {
      removingExercise.value = false
    }
  }

  function endWorkout() {
    localStorage.removeItem('currentWorkoutId')
    router.push('/workout-history')
  }

  onMounted(() => {
    console.log('WorkoutSets mounted for workout', workoutId)
    loadWorkout()
  })

  return {
    exercises,
    loadingExercises,
    modalOpen,
    selectedExercise,
    createMode,
    newExerciseForm,
    creatingExercise,
    createError,
    sets,
    muskelgruppen,
    selectedGroup,
    filteredExercises,
    addedExercises,
    saving,
    error,
    removingExercise,
    workoutTitle,
    loadExercises,
    openModal,
    saveNewExercise,
    selectExercise,
    addSetRow,
    removeSetRow,
    onRepsInput,
    onWeightInput,
    finishExercise,
    hasMissingReps: computed(() => sets.value.some(s => s.reps == null)),
    removeExercise,
    endWorkout,
  }
}
