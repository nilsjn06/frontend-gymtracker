// filepath: src/services/api.ts
const baseUrl = import.meta.env.VITE_BACKEND_BASE_URL || ''

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${text}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export async function getExercises() {
  return (await request('/api/exercises')) as any[]
}

export async function createExercise(dto: { name: string; muskelgruppe: string }) {
  return (await request('/api/exercises', {
    method: 'POST',
    body: JSON.stringify(dto),
  })) as any
}

export async function updateExercise(id: number, dto: { name: string; muskelgruppe: string }) {
  return (await request(`/api/exercises/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  })) as any
}

export async function deleteExercise(id: number) {
  return (await request(`/api/exercises/${id}`, { method: 'DELETE' }))
}

export async function createWorkout(dto: { date: string; title?: string }) {
  return (await request('/api/workouts', { method: 'POST', body: JSON.stringify(dto) })) as any
}

export async function getWorkout(id: number) {
  return (await request(`/api/workouts/${id}`)) as any
}

export async function getAllWorkouts() {
  return (await request('/api/workouts')) as any[]
}

export async function addSetToWorkout(workoutId: number, dto: { exerciseId: number; weight: number; reps: number }) {
  return (await request(`/api/workouts/${workoutId}/sets`, { method: 'POST', body: JSON.stringify(dto) })) as any
}
