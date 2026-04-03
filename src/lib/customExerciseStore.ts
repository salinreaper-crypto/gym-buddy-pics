import { supabase } from "@/integrations/supabase/client";

export interface CustomExercise {
  id: string;
  name: string;
  type: "workout" | "cardio";
  category: string;
}

export async function getCustomExercises(userId: string, type: "workout" | "cardio"): Promise<CustomExercise[]> {
  const { data, error } = await supabase
    .from("custom_exercises")
    .select("*")
    .eq("user_id", userId)
    .eq("type", type)
    .order("name");
  if (error) throw error;
  return (data ?? []) as CustomExercise[];
}

export async function saveCustomExercise(userId: string, name: string, type: "workout" | "cardio", category: string) {
  const { error } = await supabase
    .from("custom_exercises")
    .upsert({ user_id: userId, name, type, category }, { onConflict: "user_id,name,type" });
  if (error) throw error;
}
