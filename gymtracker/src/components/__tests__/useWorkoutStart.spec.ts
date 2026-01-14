import { describe, it, expect, vi, beforeEach } from 'vitest'

// 1) Mock für vue-router (useRouter)
const pushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
}))

// 2) Mock für API (createWorkout)
const createWorkoutMock = vi.fn()
vi.mock('../../services/api', () => ({
  createWorkout: (...args: any[]) => createWorkoutMock(...args),
}))

import { useWorkoutStart } from '@/views/useWorkoutStart.ts'

describe('useWorkoutStart', () => {
  beforeEach(() => {
    pushMock.mockReset()
    createWorkoutMock.mockReset()
  })

  it('setzt error, wenn kein Datum ausgewählt ist', async () => {
    const { date, title, error, submit } = useWorkoutStart()

    date.value = ''                 // kein Datum
    title.value = 'Test Workout'     // Titel ok

    await submit()

    expect(error.value).toBe('Bitte ein Datum auswählen.')
    expect(createWorkoutMock).not.toHaveBeenCalled()
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('erstellt ein Workout und navigiert zu /workouts/:id/sets (Happy Path)', async () => {
    const { date, title, error, loading, submit, minDate } = useWorkoutStart()

    date.value = minDate.value
    title.value = 'Push Day'

    createWorkoutMock.mockResolvedValue({ id: 42, date: date.value, title: 'Push Day' })

    await submit()

    expect(error.value).toBeNull()
    expect(loading.value).toBe(false)

    expect(createWorkoutMock).toHaveBeenCalledTimes(1)
    expect(createWorkoutMock).toHaveBeenCalledWith({ date: date.value, title: 'Push Day' })

    expect(pushMock).toHaveBeenCalledTimes(1)
    expect(pushMock).toHaveBeenCalledWith('/workouts/42/sets')
  })

  it('setzt error, wenn Titel fehlt', async () => {
    const { date, title, error, submit, minDate } = useWorkoutStart()

    date.value = minDate.value
    title.value = '' // fehlt

    await submit()

    expect(error.value).toBe('Bitte einen Titel eingeben.')
    expect(createWorkoutMock).not.toHaveBeenCalled()
    expect(pushMock).not.toHaveBeenCalled()
  })


  it('setzt error, wenn Titel zu lang ist', async () => {
    const { date, title, error, submit, minDate, maxTitleLength } = useWorkoutStart()

    date.value = minDate.value
    title.value = 'x'.repeat(maxTitleLength + 1) // 26 Zeichen

    await submit()

    expect(error.value).toBe(`Der Titel darf maximal ${maxTitleLength} Zeichen lang sein.`)
    expect(createWorkoutMock).not.toHaveBeenCalled()
    expect(pushMock).not.toHaveBeenCalled()
  })


})


