import { supabase } from "@/integrations/supabase/client";

export type PlanKind = "single" | "weekly";
export type ItemKind = "strength" | "cardio";

export interface PlanItem {
  id: string;
  plan_id: string;
  day_of_week: number | null; // 0=Sun..6=Sat. null for single-day
  position: number;
  exercise_name: string;
  kind: ItemKind;
  target_sets: number | null;
  target_reps: number | null;
  target_weight: number | null;
  target_duration_min: number | null;
  target_distance_km: number | null;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  kind: PlanKind;
  items: PlanItem[];
}

export async function getPlans(): Promise<WorkoutPlan[]> {
  const { data: plans, error } = await supabase
    .from("workout_plans")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!plans?.length) return [];
  const ids = plans.map((p) => p.id);
  const { data: items, error: e2 } = await supabase
    .from("workout_plan_items")
    .select("*")
    .in("plan_id", ids)
    .order("position", { ascending: true });
  if (e2) throw e2;
  return plans.map((p) => ({
    id: p.id,
    name: p.name,
    kind: p.kind as PlanKind,
    items: (items ?? []).filter((i) => i.plan_id === p.id) as any as PlanItem[],
  }));
}

export async function createPlan(name: string, kind: PlanKind, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("workout_plans")
    .insert({ name, kind, user_id: userId })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function deletePlan(id: string) {
  const { error } = await supabase.from("workout_plans").delete().eq("id", id);
  if (error) throw error;
}

export async function renamePlan(id: string, name: string) {
  const { error } = await supabase.from("workout_plans").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function addPlanItem(
  item: Omit<PlanItem, "id">,
  userId: string,
): Promise<PlanItem> {
  const { data, error } = await supabase
    .from("workout_plan_items")
    .insert({ ...item, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data as any as PlanItem;
}

export async function updatePlanItem(id: string, patch: Partial<PlanItem>) {
  const { error } = await supabase.from("workout_plan_items").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deletePlanItem(id: string) {
  const { error } = await supabase.from("workout_plan_items").delete().eq("id", id);
  if (error) throw error;
}

export function itemsForDay(plan: WorkoutPlan, dayOfWeek: number): PlanItem[] {
  if (plan.kind === "single") return plan.items.sort((a, b) => a.position - b.position);
  return plan.items
    .filter((i) => i.day_of_week === dayOfWeek)
    .sort((a, b) => a.position - b.position);
}

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_LABELS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
