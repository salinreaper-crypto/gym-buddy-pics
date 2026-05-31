import type { Workout } from "./workoutStore";

export interface PersonalRecord {
  name: string;
  weight: number;
  reps: number;
  date: string;
}

export function getPersonalRecords(workouts: Workout[]): PersonalRecord[] {
  const prMap = new Map<string, PersonalRecord>();
  for (const w of workouts) {
    for (const s of w.sets) {
      const existing = prMap.get(w.name);
      if (!existing || s.weight > existing.weight) {
        prMap.set(w.name, { name: w.name, weight: s.weight, reps: s.reps, date: w.date });
      }
    }
  }
  return Array.from(prMap.values())
    .filter((p) => p.weight > 0)
    .sort((a, b) => b.weight - a.weight);
}

export function getPRForExercise(workouts: Workout[], name: string): PersonalRecord | null {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  let best: PersonalRecord | null = null;
  for (const w of workouts) {
    if (w.name.trim().toLowerCase() !== key) continue;
    for (const s of w.sets) {
      if (!best || s.weight > best.weight) {
        best = { name: w.name, weight: s.weight, reps: s.reps, date: w.date };
      }
    }
  }
  return best && best.weight > 0 ? best : null;
}
