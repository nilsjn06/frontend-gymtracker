import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// WICHTIG: Hier NICHT mocken – wir testen das echte api.ts
import {
  createWorkout,
  getWorkout,
  getAllExercises,
  createExercise,
  addSetToWorkout,
  removeExerciseFromWorkout,
  getAllWorkouts,
  getWorkoutDetails,
  deleteWorkout,
} from '@/services/api'

const BASE = 'http://localhost:8080' // default aus api.ts, falls env nicht gesetzt

function mockFetchOkJson(data: any) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => data,
    text: async () => '',
  } as any)
}

function mockFetchNotOk(status = 500, text = 'fail') {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: false,
    status,
    json: async () => ({}),
    text: async () => text,
  } as any)
}

describe('services/api.ts', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('createWorkout: POST ok -> gibt JSON zurück', async () => {
    const dto = { date: '2026-01-01', title: 'Test' }
    const returned = { id: 1, date: '2026-01-01', title: 'Test' }

    const fetchSpy = mockFetchOkJson(returned)

    const res = await createWorkout(dto)

    expect(res).toEqual(returned)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith(`${BASE}/api/workouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    })
  })

  it('createWorkout: POST not ok -> wirft Error', async () => {
    const dto = { date: '2026-01-01', title: 'Test' }
    mockFetchNotOk(400, 'bad request')

    await expect(createWorkout(dto)).rejects.toThrow(
      'Fehler beim Erstellen des Workouts: 400 bad request'
    )
  })

  it('getWorkout: GET ok', async () => {
    const returned = { id: 5, date: '2026-01-02', title: 'W' }
    const fetchSpy = mockFetchOkJson(returned)

    const res = await getWorkout(5)

    expect(res).toEqual(returned)
    expect(fetchSpy).toHaveBeenCalledWith(`${BASE}/api/workouts/5`)
  })

  it('getAllExercises: GET ok', async () => {
    const returned = [{ id: 1, name: 'Bankdrücken', muskelgruppe: 'BRUST' }]
    const fetchSpy = mockFetchOkJson(returned)

    const res = await getAllExercises()

    expect(res).toEqual(returned)
    expect(fetchSpy).toHaveBeenCalledWith(`${BASE}/api/exercises`)
  })

  it('createExercise: POST ok', async () => {
    const dto = { name: 'Dips', muskelgruppe: 'TRIZEPS' }
    const returned = { id: 9, name: 'Dips', muskelgruppe: 'TRIZEPS' }

    const fetchSpy = mockFetchOkJson(returned)

    const res = await createExercise(dto)

    expect(res).toEqual(returned)
    expect(fetchSpy).toHaveBeenCalledWith(`${BASE}/api/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    })
  })

  it('addSetToWorkout: POST ok', async () => {
    const dto = { exerciseId: 1, weight: 80, reps: 10 }
    const returned = { id: 123 }

    const fetchSpy = mockFetchOkJson(returned)

    const res = await addSetToWorkout(7, dto)

    expect(res).toEqual(returned)
    expect(fetchSpy).toHaveBeenCalledWith(`${BASE}/api/workouts/7/sets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    })
  })

  it('removeExerciseFromWorkout: DELETE ok', async () => {
    const returned = { ok: true }
    const fetchSpy = mockFetchOkJson(returned)

    const res = await removeExerciseFromWorkout(7, 3)

    expect(res).toEqual(returned)
    expect(fetchSpy).toHaveBeenCalledWith(`${BASE}/api/workouts/7/exercises/3`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('getAllWorkouts: GET ok', async () => {
    const returned = [
      { id: 1, date: '2026-01-01', title: 'A' },
      { id: 2, date: '2026-01-02', title: 'B' },
    ]
    const fetchSpy = mockFetchOkJson(returned)

    const res = await getAllWorkouts()

    expect(res).toEqual(returned)
    expect(fetchSpy).toHaveBeenCalledWith(`${BASE}/api/workouts`)
  })

  it('getWorkoutDetails: GET ok', async () => {
    const returned = { id: 1, date: '2026-01-01', title: 'A', exercises: [] }
    const fetchSpy = mockFetchOkJson(returned)

    const res = await getWorkoutDetails(1)

    expect(res).toEqual(returned)
    expect(fetchSpy).toHaveBeenCalledWith(`${BASE}/api/workouts/1`)
  })

  it('deleteWorkout: DELETE ok -> resolved void', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => '',
      json: async () => ({}),
    } as any)

    await expect(deleteWorkout(4)).resolves.toBeUndefined()

    expect(fetchSpy).toHaveBeenCalledWith(`${BASE}/api/workouts/4`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('deleteWorkout: DELETE not ok -> wirft Error', async () => {
    mockFetchNotOk(404, 'not found')
    await expect(deleteWorkout(4)).rejects.toThrow(
      'Fehler beim Löschen des Workouts: 404 not found'
    )
  })
})
