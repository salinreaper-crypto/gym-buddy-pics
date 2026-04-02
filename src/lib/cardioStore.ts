import { supabase } from "@/integrations/supabase/client";

export interface CardioEntry {
  id: string;
  name: string;
  duration: number;
  distance?: number | null;
  calories?: number | null;
  date: string;
}

export async function getCardioEntries(): Promise<CardioEntry[]> {
  const { data, error } = await supabase
    .from("cardio_entries")
    .select("*")
    .order("entry_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((e) => ({
    id: e.id,
    name: e.name,
    duration: e.duration,
    distance: e.distance,
    calories: e.calories,
    date: e.entry_date,
  }));
}

export async function saveCardioEntry(entry: Omit<CardioEntry, "id">, userId: string) {
  const { error } = await supabase.from("cardio_entries").insert({
    user_id: userId,
    name: entry.name,
    duration: entry.duration,
    distance: entry.distance,
    calories: entry.calories,
    entry_date: entry.date,
  });
  if (error) throw error;
}

export async function deleteCardioEntry(id: string) {
  const { error } = await supabase.from("cardio_entries").delete().eq("id", id);
  if (error) throw error;
}
