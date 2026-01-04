// Diese Datei wurde entfernt. Ursprünglich hinzugefügt für Frontend-API-Aufrufe.
// Wenn du die API-Funktionen wiederherstellen möchtest, lege hier eine Implementierung an oder checke den Git-Stand ein.

const BASE = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8080';

export type CreateWorkoutDto = {
  date: string; // yyyy-MM-dd
  title?: string | null;
}

export type WorkoutViewDto = {
  id: number;
  date: string;
  title?: string | null;
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

export {};
