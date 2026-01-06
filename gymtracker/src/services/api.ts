const BASE = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8080';

export type CreateWorkoutDto = {
  date: string; // yyyy-MM-dd
  title: string; // jetzt Pflicht
}

export type WorkoutViewDto = {
  id: number;
  date: string;
  title: string; // jetzt Pflicht
}

export async function createWorkout(dto: CreateWorkoutDto): Promise<WorkoutViewDto> {
  const res = await fetch(`${BASE}/api/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fehler beim Erstellen des Workouts: ${res.status} ${text}`);
  }
  return await res.json();
}

// GET einzelnes Workout
export async function getWorkout(workoutId: number | string): Promise<WorkoutViewDto> {
  const res = await fetch(`${BASE}/api/workouts/${workoutId}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fehler beim Laden des Workouts: ${res.status} ${text}`);
  }
  return await res.json();
}

// Exercise DTO
export type ExerciseDto = {
  id: number;
  name: string;
  muskelgruppe?: string | null;
}

export async function getAllExercises(): Promise<ExerciseDto[]> {
  const res = await fetch(`${BASE}/api/exercises`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fehler beim Laden der Übungen: ${res.status} ${text}`);
  }
  return await res.json();
}

// AddSet DTO
export type AddSetDto = {
  exerciseId: number;
  weight: number;
  reps: number;
}

export async function addSetToWorkout(workoutId: number | string, dto: AddSetDto) {
  const res = await fetch(`${BASE}/api/workouts/${workoutId}/sets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fehler beim Hinzufügen des Satzes: ${res.status} ${text}`);
  }
  return await res.json();
}

export async function removeExerciseFromWorkout(workoutId: number | string, exerciseId: number | string) {
  const res = await fetch(`${BASE}/api/workouts/${workoutId}/exercises/${exerciseId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fehler beim Entfernen der Übung aus Workout: ${res.status} ${text}`)
  }
  return await res.json()
}

// --------------------------------------------------
// Neue Typen und Funktionen für den Workout-Verlauf
// --------------------------------------------------

export type WorkoutExerciseSetDto = {
  id: number;
  weight: number;
  reps: number;
}

export type WorkoutExerciseDetailDto = {
  id: number;
  name: string;
  sets: WorkoutExerciseSetDto[];
}

export type WorkoutDetailDto = {
  id: number;
  date: string;
  title: string;
  exercises: WorkoutExerciseDetailDto[];
}

// Lade alle Workouts (kurze Ansicht)
export async function getAllWorkouts(): Promise<WorkoutViewDto[]> {
  const res = await fetch(`${BASE}/api/workouts`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fehler beim Laden der Workouts: ${res.status} ${text}`);
  }
  return await res.json();
}

// Lade ein Workout inkl. Übungen und Sätzen. Erwartet, dass der Backend-Endpoint
// beim GET /api/workouts/:id detaillierte Informationen zurückliefert.
export async function getWorkoutDetails(workoutId: number | string): Promise<WorkoutDetailDto> {
  const res = await fetch(`${BASE}/api/workouts/${workoutId}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fehler beim Laden des Workouts: ${res.status} ${text}`);
  }
  return await res.json();
}

// Lösche ein Workout
export async function deleteWorkout(workoutId: number | string): Promise<void> {
  const res = await fetch(`${BASE}/api/workouts/${workoutId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fehler beim Löschen des Workouts: ${res.status} ${text}`)
  }
  // optional: return response body if provided
  return
}

export {};
