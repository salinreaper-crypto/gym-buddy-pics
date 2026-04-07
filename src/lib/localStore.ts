// Local-first storage with manual cloud sync

import { supabase } from "@/integrations/supabase/client";
import type { Workout, WorkoutSet } from "./workoutStore";
import type { CardioEntry } from "./cardioStore";
import type { CustomExercise } from "./customExerciseStore";

const KEYS = {
  workouts: "local_workouts",
  cardio: "local_cardio",
  customExercises: "local_custom_exercises",
  pendingSync: "local_pending_sync",
} as const;

// ---------- generic helpers ----------

function getLocal<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function setLocal<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Track what needs syncing
export interface PendingSync {
  workoutsToAdd: Omit<Workout, "id">[];
  workoutsToUpdate: { id: string; sets: WorkoutSet[] }[];
  workoutsToDelete: string[];
  cardioToAdd: Omit<CardioEntry, "id">[];
  cardioToUpdate: { id: string; [key: string]: any }[];
  cardioToDelete: string[];
  customExercisesToAdd: { name: string; type: "workout" | "cardio"; category: string }[];
}

function getEmptyPending(): PendingSync {
  return {
    workoutsToAdd: [],
    workoutsToUpdate: [],
    workoutsToDelete: [],
    cardioToAdd: [],
    cardioToUpdate: [],
    cardioToDelete: [],
    customExercisesToAdd: [],
  };
}

export function getPending(): PendingSync {
  try {
    return { ...getEmptyPending(), ...JSON.parse(localStorage.getItem(KEYS.pendingSync) || "{}") };
  } catch {
    return getEmptyPending();
  }
}

function savePending(p: PendingSync) {
  localStorage.setItem(KEYS.pendingSync, JSON.stringify(p));
}

export function hasPendingChanges(): boolean {
  const p = getPending();
  return (
    p.workoutsToAdd.length > 0 ||
    p.workoutsToUpdate.length > 0 ||
    p.workoutsToDelete.length > 0 ||
    p.cardioToAdd.length > 0 ||
    p.cardioToUpdate.length > 0 ||
    p.cardioToDelete.length > 0 ||
    p.customExercisesToAdd.length > 0
  );
}

export function getPendingCount(): number {
  const p = getPending();
  return (
    p.workoutsToAdd.length +
    p.workoutsToUpdate.length +
    p.workoutsToDelete.length +
    p.cardioToAdd.length +
    p.cardioToUpdate.length +
    p.cardioToDelete.length +
    p.customExercisesToAdd.length
  );
}

// ---------- WORKOUTS ----------

export function getLocalWorkouts(): Workout[] {
  return getLocal<Workout>(KEYS.workouts);
}

export function saveLocalWorkout(workout: Omit<Workout, "id">) {
  const id = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const all = getLocal<Workout>(KEYS.workouts);
  all.unshift({ ...workout, id });
  setLocal(KEYS.workouts, all);

  const p = getPending();
  p.workoutsToAdd.push(workout);
  savePending(p);
}

export function updateLocalWorkoutSets(id: string, sets: WorkoutSet[]) {
  const all = getLocal<Workout>(KEYS.workouts);
  const idx = all.findIndex((w) => w.id === id);
  if (idx >= 0) {
    all[idx].sets = sets;
    setLocal(KEYS.workouts, all);
  }

  const p = getPending();
  if (!id.startsWith("local_")) {
    const existing = p.workoutsToUpdate.findIndex((u) => u.id === id);
    if (existing >= 0) {
      p.workoutsToUpdate[existing].sets = sets;
    } else {
      p.workoutsToUpdate.push({ id, sets });
    }
    savePending(p);
  } else {
    const pendingIdx = p.workoutsToAdd.findIndex((w) => w.date === all[idx]?.date && w.name === all[idx]?.name);
    if (pendingIdx >= 0) {
      p.workoutsToAdd[pendingIdx].sets = sets;
      savePending(p);
    }
  }
}

export function deleteLocalWorkout(id: string) {
  const all = getLocal<Workout>(KEYS.workouts);
  const workoutToDelete = all.find((w) => w.id === id);
  setLocal(KEYS.workouts, all.filter((w) => w.id !== id));

  const p = getPending();
  if (id.startsWith("local_")) {
    if (workoutToDelete) {
      p.workoutsToAdd = p.workoutsToAdd.filter((w) => w.date !== workoutToDelete.date || w.name !== workoutToDelete.name);
    }
  } else {
    p.workoutsToDelete.push(id);
  }
  savePending(p);
}

// ---------- CARDIO ----------

export function getLocalCardio(): CardioEntry[] {
  return getLocal<CardioEntry>(KEYS.cardio);
}

export function saveLocalCardio(entry: Omit<CardioEntry, "id">) {
  const id = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const all = getLocal<CardioEntry>(KEYS.cardio);
  all.unshift({ ...entry, id });
  setLocal(KEYS.cardio, all);

  const p = getPending();
  p.cardioToAdd.push(entry);
  savePending(p);
}

export function updateLocalCardio(id: string, updates: Partial<Omit<CardioEntry, "id">>) {
  const all = getLocal<CardioEntry>(KEYS.cardio);
  const idx = all.findIndex((e) => e.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...updates };
    setLocal(KEYS.cardio, all);
  }

  const p = getPending();
  if (!id.startsWith("local_")) {
    if (!p.cardioToUpdate) p.cardioToUpdate = [];
    const existing = p.cardioToUpdate.findIndex((u) => u.id === id);
    if (existing >= 0) {
      p.cardioToUpdate[existing] = { ...p.cardioToUpdate[existing], ...updates };
    } else {
      p.cardioToUpdate.push({ id, ...updates });
    }
    savePending(p);
  }
}

export function deleteLocalCardio(id: string) {
  const all = getLocal<CardioEntry>(KEYS.cardio);
  const entryToDelete = all.find((e) => e.id === id);
  setLocal(KEYS.cardio, all.filter((e) => e.id !== id));

  const p = getPending();
  if (id.startsWith("local_")) {
    if (entryToDelete) {
      p.cardioToAdd = p.cardioToAdd.filter((e) => e.date !== entryToDelete.date || e.name !== entryToDelete.name);
    }
  } else {
    p.cardioToDelete.push(id);
  }
  savePending(p);
}

// ---------- CUSTOM EXERCISES ----------

export function getLocalCustomExercises(type: "workout" | "cardio"): CustomExercise[] {
  return getLocal<CustomExercise>(KEYS.customExercises).filter((e) => e.type === type);
}

export function saveLocalCustomExercise(name: string, type: "workout" | "cardio", category: string) {
  const all = getLocal<CustomExercise>(KEYS.customExercises);
  if (all.some((e) => e.name === name && e.type === type)) return;
  const id = `local_${Date.now()}`;
  all.push({ id, name, type, category });
  setLocal(KEYS.customExercises, all);

  const p = getPending();
  p.customExercisesToAdd.push({ name, type, category });
  savePending(p);
}

// ---------- INITIAL LOAD from cloud ----------

export async function pullFromCloud() {
  const [workoutsRes, cardioRes] = await Promise.all([
    supabase.from("workouts").select("*").order("workout_date", { ascending: false }),
    supabase.from("cardio_entries").select("*").order("entry_date", { ascending: false }),
  ]);

  if (workoutsRes.data) {
    const cloudWorkouts: Workout[] = workoutsRes.data.map((w) => ({
      id: w.id,
      name: w.name,
      sets: w.sets as any as WorkoutSet[],
      photo: w.photo,
      date: w.workout_date,
    }));
    const localOnly = getLocal<Workout>(KEYS.workouts).filter((w) => w.id.startsWith("local_"));
    setLocal(KEYS.workouts, [...localOnly, ...cloudWorkouts]);
  }

  if (cardioRes.data) {
    const cloudCardio: CardioEntry[] = cardioRes.data.map((e) => ({
      id: e.id,
      name: e.name,
      duration: e.duration,
      distance: e.distance,
      calories: e.calories,
      date: e.entry_date,
    }));
    const localOnly = getLocal<CardioEntry>(KEYS.cardio).filter((e) => e.id.startsWith("local_"));
    setLocal(KEYS.cardio, [...localOnly, ...cloudCardio]);
  }
}

// ---------- SYNC to cloud ----------

export async function syncToCloud(userId: string): Promise<{ success: boolean; synced: number }> {
  const p = getPending();
  let synced = 0;
  const errors: string[] = [];

  for (const w of p.workoutsToAdd) {
    const { error } = await supabase.from("workouts").insert({
      user_id: userId,
      name: w.name,
      sets: w.sets as any,
      photo: w.photo,
      workout_date: w.date,
    });
    if (error) errors.push(error.message);
    else synced++;
  }

  for (const u of p.workoutsToUpdate) {
    const { error } = await supabase.from("workouts").update({ sets: u.sets as any }).eq("id", u.id);
    if (error) errors.push(error.message);
    else synced++;
  }

  for (const id of p.workoutsToDelete) {
    const { error } = await supabase.from("workouts").delete().eq("id", id);
    if (error) errors.push(error.message);
    else synced++;
  }

  for (const e of p.cardioToAdd) {
    const { error } = await supabase.from("cardio_entries").insert({
      user_id: userId,
      name: e.name,
      duration: e.duration,
      distance: e.distance,
      calories: e.calories,
      entry_date: e.date,
    });
    if (error) errors.push(error.message);
    else synced++;
  }

  for (const id of p.cardioToDelete) {
    const { error } = await supabase.from("cardio_entries").delete().eq("id", id);
    if (error) errors.push(error.message);
    else synced++;
  }

  for (const ce of p.customExercisesToAdd) {
    const { error } = await supabase
      .from("custom_exercises")
      .upsert({ user_id: userId, name: ce.name, type: ce.type, category: ce.category }, { onConflict: "user_id,name,type" });
    if (error) errors.push(error.message);
    else synced++;
  }

  if (errors.length === 0) {
    savePending(getEmptyPending());
    await pullFromCloud();
    return { success: true, synced };
  }

  return { success: false, synced };
}
