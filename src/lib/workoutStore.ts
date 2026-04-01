export interface WorkoutSet {
  reps: number;
  weight: number;
}

export interface Workout {
  id: string;
  name: string;
  sets: WorkoutSet[];
  photo?: string; // base64 data URL
  date: string; // ISO string
}

const STORAGE_KEY = "workouts";

export function getWorkouts(): Workout[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveWorkout(workout: Workout) {
  const workouts = getWorkouts();
  workouts.unshift(workout);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
}

export function deleteWorkout(id: string) {
  const workouts = getWorkouts().filter((w) => w.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
}

export function getWorkout(id: string): Workout | undefined {
  return getWorkouts().find((w) => w.id === id);
}
