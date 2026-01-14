import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { useWorkoutSets } from '@/views/useWorkoutSets'

// --------------------
// Router-Mocks
// --------------------
const pushMock = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: { id: '123' },
  }),
  useRouter: () => ({
    push: pushMock,
  }),
}))

// --------------------
// API-Mocks
// --------------------
const getAllExercisesMock = vi.fn()
const addSetToWorkoutMock = vi.fn()
const getWorkoutMock = vi.fn()
const removeExerciseFromWorkoutMock = vi.fn()
const createExerciseMock = vi.fn()

vi.mock('@/services/api', () => ({
  getAllExercises: (...a: any[]) => getAllExercisesMock(...a),
  addSetToWorkout: (...a: any[]) => addSetToWorkoutMock(...a),
  getWorkout: (...a: any[]) => getWorkoutMock(...a),
  removeExerciseFromWorkout: (...a: any[]) => removeExerciseFromWorkoutMock(...a),
  createExercise: (...a: any[]) => createExerciseMock(...a),
}))

// --------------------
// Harness
// --------------------
function mountUseWorkoutSets(): ReturnType<typeof useWorkoutSets> {
  let exposed!: ReturnType<typeof useWorkoutSets>

  const Harness = defineComponent({
    setup() {
      exposed = useWorkoutSets()
      return () => null
    },
  })

  mount(Harness)
  return exposed
}

describe('useWorkoutSets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    // default für onMounted(loadWorkout)
    getWorkoutMock.mockResolvedValue({ id: 123, title: 'Test Workout' })
  })

  afterEach(() => {
    ;(console.log as any).mockRestore?.()
  })

  it('mountet useWorkoutSets ohne Fehler', async () => {
    getWorkoutMock.mockResolvedValue({ id: 123, title: 'Test Workout' })

    const state = mountUseWorkoutSets()
    await nextTick()

    expect(state.workoutTitle.value).toBe('Test Workout')
  })

  it('addSetRow und removeSetRow funktionieren korrekt', () => {
    const { sets, addSetRow, removeSetRow } = mountUseWorkoutSets()

    expect(sets.value.length).toBe(0)

    addSetRow()
    expect(sets.value.length).toBe(1)

    addSetRow()
    expect(sets.value.length).toBe(2)

    removeSetRow(0)
    expect(sets.value.length).toBe(1)
  })

  it('onRepsInput erlaubt nur Zahlen und max. 4 Stellen', () => {
    const { sets, onRepsInput } = mountUseWorkoutSets()

    const row = { reps: null, weight: null }
    sets.value.push(row)

    const input = document.createElement('input')
    input.value = '12ab3456'

    onRepsInput({ target: input } as any, row)

    expect(row.reps).toBe(1234)
    expect(input.value).toBe('1234')
  })

  it('onWeightInput normalisiert Gewicht korrekt', () => {
    const { sets, onWeightInput } = mountUseWorkoutSets()

    const row = { reps: null, weight: null }
    sets.value.push(row)

    const input = document.createElement('input')
    input.value = '1234,567kg'

    onWeightInput({ target: input } as any, row)

    expect(row.weight).toBe(123.56)
    expect(input.value).toBe('123,56')
  })

  it('endWorkout entfernt currentWorkoutId aus localStorage und navigiert zu /workout-history', () => {
    const removeSpy = vi.spyOn(window.localStorage.__proto__, 'removeItem')
    window.localStorage.setItem('currentWorkoutId', '123')

    const { endWorkout } = mountUseWorkoutSets()

    endWorkout()

    expect(removeSpy).toHaveBeenCalledWith('currentWorkoutId')
    expect(pushMock).toHaveBeenCalledWith('/workout-history')
  })

  it('openModal öffnet Modal, reset error/createMode und lädt Übungen wenn exercises leer', async () => {
    getAllExercisesMock.mockResolvedValue([{ id: 1, name: 'Bankdrücken', muskelgruppe: 'BRUST' }])

    const s = mountUseWorkoutSets()

    expect(s.exercises.value.length).toBe(0)
    s.error.value = 'irgendwas'
    s.createMode.value = true
    s.createError.value = 'x'

    s.openModal()

    expect(s.modalOpen.value).toBe(true)
    expect(s.error.value).toBeNull()
    expect(s.createMode.value).toBe(false)
    expect(s.createError.value).toBeNull()

    await nextTick()
    await nextTick()

    expect(getAllExercisesMock).toHaveBeenCalledTimes(1)
    expect(s.exercises.value.length).toBe(1)
  })

  it('openModal lädt Übungen nicht neu, wenn exercises bereits gefüllt ist', async () => {
    const s = mountUseWorkoutSets()
    s.exercises.value = [{ id: 1, name: 'X', muskelgruppe: 'BRUST' }]

    s.openModal()
    await nextTick()

    expect(getAllExercisesMock).not.toHaveBeenCalled()
    expect(s.modalOpen.value).toBe(true)
  })

  it('loadExercises setzt error wenn API fehlschlägt', async () => {
    getAllExercisesMock.mockRejectedValue(new Error('boom'))

    const s = mountUseWorkoutSets()
    await s.loadExercises()

    expect(s.error.value).toBe('boom')
    expect(s.loadingExercises.value).toBe(false)
  })

  it('selectExercise setzt selectedExercise, initialisiert sets und schließt Modal', async () => {
    const s = mountUseWorkoutSets()
    s.modalOpen.value = true

    s.selectExercise({ id: 7, name: 'Dips', muskelgruppe: 'TRIZEPS' })

    expect(s.selectedExercise.value?.id).toBe(7)
    expect(s.sets.value.length).toBe(1)
    expect(s.sets.value[0]).toEqual({ reps: null, weight: null })
    expect(s.modalOpen.value).toBe(false)
  })

  it('saveNewExercise setzt createError wenn Name leer ist', async () => {
    const s = mountUseWorkoutSets()

    s.createMode.value = true
    s.newExerciseForm.value.name = '   '

    await s.saveNewExercise()

    expect(s.createError.value).toBe('Bitte einen Namen für die Übung eingeben.')
    expect(createExerciseMock).not.toHaveBeenCalled()
  })

  it('saveNewExercise setzt createError wenn Name zu lang ist', async () => {
    const s = mountUseWorkoutSets()

    s.createMode.value = true
    s.newExerciseForm.value.name = 'a'.repeat(16)

    await s.saveNewExercise()

    expect(s.createError.value).toBe('Der Name darf maximal 15 Zeichen lang sein.')
    expect(createExerciseMock).not.toHaveBeenCalled()
  })

  it('saveNewExercise erstellt Übung, lädt Übungen neu und selektiert erstellte Übung', async () => {
    const created = { id: 99, name: 'Neue Übung', muskelgruppe: 'BRUST' }

    createExerciseMock.mockResolvedValue(created)
    getAllExercisesMock.mockResolvedValue([{ id: 1, name: 'Alt', muskelgruppe: 'BAUCH' }, created])

    const s = mountUseWorkoutSets()

    s.modalOpen.value = true
    s.createMode.value = true
    s.newExerciseForm.value = { name: 'Neue Übung', muskelgruppe: 'BRUST' }

    await s.saveNewExercise()

    expect(createExerciseMock).toHaveBeenCalledTimes(1)
    expect(getAllExercisesMock).toHaveBeenCalled()

    expect(s.selectedExercise.value?.id).toBe(99)
    expect(s.sets.value.length).toBe(1)
    expect(s.modalOpen.value).toBe(false)

    expect(s.newExerciseForm.value).toEqual({ name: '', muskelgruppe: 'BRUST' })
    expect(s.createMode.value).toBe(false)
    expect(s.creatingExercise.value).toBe(false)
    expect(s.createError.value).toBeNull()
  })

  it('finishExercise speichert nur vollständige Sets und pusht nach addedExercises', async () => {
    addSetToWorkoutMock.mockResolvedValue({})

    const s = mountUseWorkoutSets()

    s.selectedExercise.value = { id: 10, name: 'Bankdrücken', muskelgruppe: 'BRUST' }
    s.sets.value = [
      { reps: 10, weight: 80 },
      { reps: null, weight: 60 },
      { reps: 8, weight: null },
      { reps: 6, weight: 90 },
    ]

    await s.finishExercise()

    expect(addSetToWorkoutMock).toHaveBeenCalledTimes(2)
    expect(addSetToWorkoutMock).toHaveBeenNthCalledWith(1, '123', { exerciseId: 10, reps: 10, weight: 80 })
    expect(addSetToWorkoutMock).toHaveBeenNthCalledWith(2, '123', { exerciseId: 10, reps: 6, weight: 90 })

    expect(s.addedExercises.value).toHaveLength(1)
    const first = s.addedExercises.value[0]!
    expect(first.exercise.id).toBe(10)
    expect(first.sets.length).toBe(4)

    expect(s.selectedExercise.value).toBeNull()
    expect(s.sets.value.length).toBe(0)
    expect(s.saving.value).toBe(false)
    expect(s.error.value).toBeNull()
  })

  it('finishExercise setzt error wenn addSetToWorkout fehlschlägt', async () => {
    addSetToWorkoutMock.mockRejectedValue(new Error('kaputt'))

    const s = mountUseWorkoutSets()
    s.selectedExercise.value = { id: 10, name: 'Bankdrücken', muskelgruppe: 'BRUST' }
    s.sets.value = [{ reps: 10, weight: 80 }]

    await s.finishExercise()

    expect(s.error.value).toBe('kaputt')
    expect(s.saving.value).toBe(false)
  })

  it('removeExercise setzt addedExercises aus updated.exercises wenn Backend sie liefert', async () => {
    removeExerciseFromWorkoutMock.mockResolvedValue({
      exercises: [
        {
          exerciseId: 5,
          exerciseName: 'Klimmzüge',
          sets: [{ reps: 8, kg: 0 }],
        },
      ],
    })

    const s = mountUseWorkoutSets()
    s.addedExercises.value = [{ exercise: { id: 1, name: 'Alt', muskelgruppe: null }, sets: [{ reps: 1, weight: 1 }] }]

    await s.removeExercise(1)

    expect(removeExerciseFromWorkoutMock).toHaveBeenCalledWith('123', 1)

    expect(s.addedExercises.value).toHaveLength(1)
    expect(s.addedExercises.value[0]!.exercise).toEqual({ id: 5, name: 'Klimmzüge', muskelgruppe: null })
    expect(s.addedExercises.value[0]!.sets).toEqual([{ reps: 8, weight: 0 }])
  })

  it('removeExercise filtert lokal wenn Backend kein exercises liefert', async () => {
    removeExerciseFromWorkoutMock.mockResolvedValue({})

    const s = mountUseWorkoutSets()
    s.addedExercises.value = [
      { exercise: { id: 1, name: 'A', muskelgruppe: null }, sets: [] },
      { exercise: { id: 2, name: 'B', muskelgruppe: null }, sets: [] },
    ]

    await s.removeExercise(1)

    expect(removeExerciseFromWorkoutMock).toHaveBeenCalledWith('123', 1)
    expect(s.addedExercises.value.map(x => x.exercise.id)).toEqual([2])
  })

  it('removeExercise setzt error bei Fehler', async () => {
    removeExerciseFromWorkoutMock.mockRejectedValue(new Error('nope'))

    const s = mountUseWorkoutSets()
    await s.removeExercise(1)

    expect(removeExerciseFromWorkoutMock).toHaveBeenCalledWith('123', 1)
    expect(s.error.value).toBe('nope')
    expect(s.removingExercise.value).toBe(false)
  })

  it('setzt workoutTitle auf Fallback wenn getWorkout fehlschlägt', async () => {
    getWorkoutMock.mockRejectedValue(new Error('fail'))

    const s = mountUseWorkoutSets()
    await nextTick()
    await nextTick()

    expect(s.workoutTitle.value).toBe('Workout 123')
  })
})
