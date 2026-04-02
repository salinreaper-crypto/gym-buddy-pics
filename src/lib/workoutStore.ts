import { supabase } from "@/integrations/supabase/client";

export interface WorkoutSet {
  reps: number;
  weight: number;
}

export interface Workout {
  id: string;
  name: string;
  sets: WorkoutSet[];
  photo?: string | null;
  date: string; // ISO string
}

export async function getWorkouts(): Promise<Workout[]> {
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .order("workout_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((w) => ({
    id: w.id,
    name: w.name,
    sets: (w.sets as any) as WorkoutSet[],
    photo: w.photo,
    date: w.workout_date,
  }));
}

export async function saveWorkout(workout: Omit<Workout, "id">, userId: string) {
  const { error } = await supabase.from("workouts").insert({
    user_id: userId,
    name: workout.name,
    sets: workout.sets as any,
    photo: workout.photo,
    workout_date: workout.date,
  });
  if (error) throw error;
}

export async function deleteWorkout(id: string) {
  const { error } = await supabase.from("workouts").delete().eq("id", id);
  if (error) throw error;
}
