import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { useWorkoutHistory } from '@/components/useWorkoutHistory.ts'

// --------------------
// API-Mocks
// --------------------
const getAllWorkoutsMock = vi.fn()
const getWorkoutDetailsMock = vi.fn()
const getAllExercisesMock = vi.fn()
const deleteWorkoutMock = vi.fn()

vi.mock('@/services/api', () => ({
  getAllWorkouts: (...a: any[]) => getAllWorkoutsMock(...a),
  getWorkoutDetails: (...a: any[]) => getWorkoutDetailsMock(...a),
  getAllExercises: (...a: any[]) => getAllExercisesMock(...a),
  deleteWorkout: (...a: any[]) => deleteWorkoutMock(...a),
}))

// --------------------
// Helpers
// --------------------
async function flushPromises(times = 3) {
  // sorgt dafür, dass onMounted(loadWorkouts) + alle awaits wirklich fertig sind
  for (let i = 0; i < times; i++) {
    await Promise.resolve()
  }
  await new Promise(r => setTimeout(r, 0))
}

// --------------------
// Harness
// --------------------
function mountUseWorkoutHistory(): ReturnType<typeof useWorkoutHistory> {
  let exposed!: ReturnType<typeof useWorkoutHistory>

  const Harness = defineComponent({
    setup() {
      exposed = useWorkoutHistory()
      return () => null
    },
  })

  mount(Harness)
  return exposed
}

describe('useWorkoutHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    ;(console.log as any).mockRestore?.()
  })

  it('getDisplayName gibt Namen zurück, wenn vorhanden', async () => {
    getAllWorkoutsMock.mockResolvedValue([])
    getAllExercisesMock.mockResolvedValue([])

    const s = mountUseWorkoutHistory()
    await flushPromises()

    expect(s.getDisplayName({ id: 1, name: 'Bankdrücken' })).toBe('Bankdrücken')
  })

  it('getDisplayName nutzt Fallbacks (Übung <id> / Unbenannte Übung)', async () => {
    getAllWorkoutsMock.mockResolvedValue([])
    getAllExercisesMock.mockResolvedValue([])

    const s = mountUseWorkoutHistory()
    await flushPromises()

    expect(s.getDisplayName({ id: 7, name: '   ' })).toBe('Übung 7')
    expect(s.getDisplayName({ id: -1, name: '   ' })).toBe('Unbenannte Übung')
    expect(s.getDisplayName(null as any)).toBe('Unbenannte Übung')
  })

  it('lädt Workouts und sortiert absteigend nach Datum', async () => {
    getAllWorkoutsMock.mockResolvedValue([
      { id: 1, date: '2026-01-01', title: 'A' },
      { id: 2, date: '2026-02-01', title: 'B' },
    ])

    getAllExercisesMock.mockResolvedValue([])

    getWorkoutDetailsMock.mockImplementation(async (id: number) => {
      if (id === 1) return { id: 1, date: '2026-01-01', title: 'A', exercises: [] }
      return { id: 2, date: '2026-02-01', title: 'B', exercises: [] }
    })

    const s = mountUseWorkoutHistory()
    await flushPromises(6)

    expect(s.loading.value).toBe(false)
    expect(s.error.value).toBeNull()

    expect(s.workouts.value).toHaveLength(2)
    expect(s.workouts.value[0].id).toBe(2)
    expect(s.workouts.value[1].id).toBe(1)
  })

  it('normalisiert Details: exercises[] mit sets (inkl. exerciseName aus DTO)', async () => {
    getAllWorkoutsMock.mockResolvedValue([{ id: 10, date: '2026-01-10', title: 'T' }])
    getAllExercisesMock.mockResolvedValue([])

    getWorkoutDetailsMock.mockResolvedValue({
      id: 10,
      date: '2026-01-10',
      title: 'T',
      exercises: [
        {
          id: 5,
          name: 'Klimmzüge',
          sets: [{ id: 1, weight: 0, reps: 8 }],
        },
      ],
    })

    const s = mountUseWorkoutHistory()
    await flushPromises(6)

    expect(s.workouts.value).toHaveLength(1)
    const w = s.workouts.value[0]!
    expect(w.exercises).toHaveLength(1)
    expect(w.exercises[0]).toEqual({
      id: 5,
      name: 'Klimmzüge',
      sets: [{ id: 1, weight: 0, reps: 8 }],
    })
  })

  it('normalisiert Details: fallback wenn Backend sets[] liefert (group by exerciseId)', async () => {
    getAllWorkoutsMock.mockResolvedValue([{ id: 20, date: '2026-01-20', title: 'X' }])

    getAllExercisesMock.mockResolvedValue([{ id: 9, name: 'Bankdrücken', muskelgruppe: 'BRUST' }])

    getWorkoutDetailsMock.mockResolvedValue({
      id: 20,
      date: '2026-01-20',
      title: 'X',
      sets: [
        { id: 1, exerciseId: 9, exerciseName: 'Bankdrücken', kg: 80, reps: 10 },
        { id: 2, exerciseId: 9, exerciseName: 'Bankdrücken', kg: 85, reps: 8 },
      ],
    })

    const s = mountUseWorkoutHistory()
    await flushPromises(6)

    const w = s.workouts.value[0]!
    expect(w.exercises).toHaveLength(1)

    expect(w.exercises[0].id).toBe(9)
    expect(w.exercises[0].name).toBe('Bankdrücken')
    expect(w.exercises[0].sets).toEqual([
      { id: 1, weight: 80, reps: 10 },
      { id: 2, weight: 85, reps: 8 },
    ])
  })

  it('handleDelete: bei confirm=false passiert nichts', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    getAllWorkoutsMock.mockResolvedValue([])
    getAllExercisesMock.mockResolvedValue([])

    const s = mountUseWorkoutHistory()
    await flushPromises()

    s.workouts.value = [{ id: 1, date: '2026-01-01', title: 'A', exercises: [] }]

    await s.handleDelete(1)

    expect(deleteWorkoutMock).not.toHaveBeenCalled()
    expect(s.workouts.value).toHaveLength(1)
  })

  it('handleDelete: bei confirm=true wird gelöscht und lokal entfernt', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    deleteWorkoutMock.mockResolvedValue(undefined)

    // wichtig: onMounted darf nix später überschreiben
    getAllWorkoutsMock.mockResolvedValue([])
    getAllExercisesMock.mockResolvedValue([])

    const s = mountUseWorkoutHistory()
    await flushPromises()

    // erst NACH onMounted fertig ist setzen
    s.workouts.value = [
      { id: 1, date: '2026-01-01', title: 'A', exercises: [] },
      { id: 2, date: '2026-02-01', title: 'B', exercises: [] },
    ]

    await s.handleDelete(1)

    expect(deleteWorkoutMock).toHaveBeenCalledWith(1)
    expect(s.workouts.value.map(w => w.id)).toEqual([2])
    expect(s.deleting.value['1']).toBe(false)
  })

  it('handleDelete: bei Fehler zeigt alert und setzt deleting zurück', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    deleteWorkoutMock.mockRejectedValue(new Error('kaputt'))

    getAllWorkoutsMock.mockResolvedValue([])
    getAllExercisesMock.mockResolvedValue([])

    const s = mountUseWorkoutHistory()
    await flushPromises()

    s.workouts.value = [{ id: 1, date: '2026-01-01', title: 'A', exercises: [] }]

    await s.handleDelete(1)

    expect(alertSpy).toHaveBeenCalled()
    expect(s.deleting.value['1']).toBe(false)
    expect(s.workouts.value).toHaveLength(1)
  })

  it('setzt error, wenn getAllWorkouts fehlschlägt', async () => {
    getAllWorkoutsMock.mockRejectedValue(new Error('boom'))

    const s = mountUseWorkoutHistory()
    await flushPromises()

    expect(s.loading.value).toBe(false)
    expect(s.error.value).toBe('boom')
  })
})
