import { supabase } from "@/integrations/supabase/client";

export interface NutritionEntry {
  id: string;
  food: string;
  calories: number;
  consumed_at: string; // ISO
}

export interface BurntEntry {
  id: string;
  calories: number;
  entry_date: string; // YYYY-MM-DD
  source: string;
}

const NUTRITION_KEY = "local_nutrition";
const BURNT_KEY = "local_burnt";

function getCached<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}
function setCached<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function getCachedNutrition(): NutritionEntry[] {
  return getCached<NutritionEntry>(NUTRITION_KEY);
}
export function getCachedBurnt(): BurntEntry[] {
  return getCached<BurntEntry>(BURNT_KEY);
}

export async function pullNutrition(): Promise<NutritionEntry[]> {
  const { data, error } = await supabase
    .from("nutrition_entries")
    .select("id, food, calories, consumed_at")
    .order("consumed_at", { ascending: false });
  if (error || !data) return getCachedNutrition();
  setCached(NUTRITION_KEY, data);
  return data as NutritionEntry[];
}

export async function pullBurnt(): Promise<BurntEntry[]> {
  const { data, error } = await supabase
    .from("calories_burnt_entries")
    .select("id, calories, entry_date, source")
    .order("entry_date", { ascending: false });
  if (error || !data) return getCachedBurnt();
  setCached(BURNT_KEY, data);
  return data as BurntEntry[];
}

export async function addNutrition(userId: string, food: string, calories: number, consumed_at: string) {
  const { data, error } = await supabase
    .from("nutrition_entries")
    .insert({ user_id: userId, food, calories, consumed_at })
    .select()
    .single();
  if (error) throw error;
  const all = [data as NutritionEntry, ...getCachedNutrition()];
  setCached(NUTRITION_KEY, all);
  return data as NutritionEntry;
}

export async function deleteNutrition(id: string) {
  await supabase.from("nutrition_entries").delete().eq("id", id);
  setCached(NUTRITION_KEY, getCachedNutrition().filter((n) => n.id !== id));
}

export async function upsertBurnt(userId: string, entry_date: string, calories: number, source = "garmin") {
  const { data, error } = await supabase
    .from("calories_burnt_entries")
    .upsert(
      { user_id: userId, entry_date, calories, source },
      { onConflict: "user_id,entry_date" }
    )
    .select()
    .single();
  if (error) throw error;
  const rest = getCachedBurnt().filter((b) => b.entry_date !== entry_date);
  setCached(BURNT_KEY, [data as BurntEntry, ...rest]);
  return data as BurntEntry;
}

export async function estimateCalories(food: string): Promise<{ calories: number; note?: string }> {
  const { data, error } = await supabase.functions.invoke("estimate-calories", {
    body: { food },
  });
  if (error) throw error;
  return data as { calories: number; note?: string };
}
