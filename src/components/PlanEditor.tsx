import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addPlanItem,
  deletePlanItem,
  DAY_LABELS,
  itemsForDay,
  renamePlan,
  type PlanItem,
  type WorkoutPlan,
  updatePlanItem,
} from "@/lib/plansStore";
import { EXERCISES, CATEGORY_LABELS, type ExerciseCategory } from "@/lib/exercises";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Props {
  plan: WorkoutPlan;
  onClose: () => void;
  onChanged: () => void;
}

const CARDIO_PRESETS = ["Treadmill", "Cycling", "Rowing", "Elliptical", "Stair Climber", "Outdoor Run", "Walk"];

export default function PlanEditor({ plan, onClose, onChanged }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState(plan.name);
  const [activeDay, setActiveDay] = useState<number>(plan.kind === "weekly" ? new Date().getDay() : 0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerCategory, setPickerCategory] = useState<ExerciseCategory | "cardio" | null>(null);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PlanItem[]>(plan.items);

  useEffect(() => setItems(plan.items), [plan.items]);

  const dayItems = useMemo(() => {
    const filtered = plan.kind === "weekly"
      ? items.filter((i) => i.day_of_week === activeDay)
      : items;
    return [...filtered].sort((a, b) => a.position - b.position);
  }, [items, activeDay, plan.kind]);

  const handleRename = async () => {
    if (name.trim() === plan.name || !name.trim()) return;
    try {
      await renamePlan(plan.id, name.trim());
      onChanged();
    } catch {
      toast({ title: "Rename failed", variant: "destructive" });
    }
  };

  const addItem = async (exerciseName: string, kind: "strength" | "cardio") => {
    if (!user) return;
    try {
      const newItem = await addPlanItem(
        {
          plan_id: plan.id,
          day_of_week: plan.kind === "weekly" ? activeDay : null,
          position: dayItems.length,
          exercise_name: exerciseName,
          kind,
          target_sets: kind === "strength" ? 3 : null,
          target_reps: kind === "strength" ? 10 : null,
          target_weight: kind === "strength" ? 0 : null,
          target_duration_min: kind === "cardio" ? 20 : null,
          target_distance_km: null,
        },
        user.id,
      );
      setItems((prev) => [...prev, newItem]);
      setPickerOpen(false);
      setPickerCategory(null);
      setQuery("");
      onChanged();
    } catch {
      toast({ title: "Could not add exercise", variant: "destructive" });
    }
  };

  const removeItem = async (id: string) => {
    try {
      await deletePlanItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      onChanged();
    } catch {
      toast({ title: "Could not remove", variant: "destructive" });
    }
  };

  const patchItem = async (id: string, patch: Partial<PlanItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    try {
      await updatePlanItem(id, patch);
      onChanged();
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
  };

  const filteredPreset = useMemo(() => {
    if (pickerCategory === "cardio") {
      return CARDIO_PRESETS.filter((n) => n.toLowerCase().includes(query.toLowerCase()));
    }
    if (!pickerCategory) return [];
    return EXERCISES
      .filter((e) => e.category === pickerCategory && e.name.toLowerCase().includes(query.toLowerCase()))
      .map((e) => e.name);
  }, [pickerCategory, query]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-2xl bg-card border-t border-border p-6 pb-10"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">Edit Plan</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleRename}
          className="mb-4 bg-secondary border-none h-11 text-base font-display font-semibold"
        />

        {plan.kind === "weekly" && (
          <div className="flex gap-1 mb-4 overflow-x-auto -mx-1 px-1">
            {DAY_LABELS.map((label, i) => (
              <button
                key={i}
                onClick={() => setActiveDay(i)}
                className={`flex-1 min-w-[44px] py-2 rounded-md text-xs font-display font-bold tracking-wider uppercase transition-colors ${
                  activeDay === i
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-3 mb-4">
          {dayItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No exercises{plan.kind === "weekly" ? ` for ${DAY_LABELS[activeDay]}` : ""} yet.
            </p>
          ) : (
            dayItems.map((item) => (
              <div key={item.id} className="bg-secondary/50 rounded-lg p-3 border border-border">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-sm truncate">{item.exercise_name}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                      {item.kind}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {item.kind === "strength" ? (
                  <div className="grid grid-cols-3 gap-2">
                    <NumField
                      label="Sets"
                      value={item.target_sets}
                      onCommit={(v) => patchItem(item.id, { target_sets: v })}
                    />
                    <NumField
                      label="Reps"
                      value={item.target_reps}
                      onCommit={(v) => patchItem(item.id, { target_reps: v })}
                    />
                    <NumField
                      label="Weight (kg)"
                      value={item.target_weight}
                      step={2.5}
                      onCommit={(v) => patchItem(item.id, { target_weight: v })}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <NumField
                      label="Mins"
                      value={item.target_duration_min}
                      onCommit={(v) => patchItem(item.id, { target_duration_min: v })}
                    />
                    <NumField
                      label="Km"
                      value={item.target_distance_km}
                      step={0.5}
                      onCommit={(v) => patchItem(item.id, { target_distance_km: v })}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {!pickerOpen ? (
          <Button
            variant="outline"
            onClick={() => setPickerOpen(true)}
            className="w-full h-11 border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Exercise
          </Button>
        ) : (
          <div className="rounded-lg bg-secondary border border-border overflow-hidden">
            <div className="p-3 flex items-center gap-2 border-b border-border">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search or pick a category…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-transparent border-none h-9 p-0 text-sm focus-visible:ring-0"
              />
              <button onClick={() => { setPickerOpen(false); setPickerCategory(null); setQuery(""); }}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            {!pickerCategory ? (
              <div className="p-2 grid grid-cols-2 gap-2">
                {(["push", "pull", "legs", "core"] as ExerciseCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setPickerCategory(cat)}
                    className="py-2.5 rounded-md bg-muted/50 hover:bg-muted text-sm font-display font-semibold"
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
                <button
                  onClick={() => setPickerCategory("cardio")}
                  className="col-span-2 py-2.5 rounded-md bg-muted/50 hover:bg-muted text-sm font-display font-semibold"
                >
                  Cardio
                </button>
                {query.trim() && (
                  <>
                    <button
                      onClick={() => addItem(query.trim(), "strength")}
                      className="col-span-2 py-2.5 rounded-md bg-primary/10 text-primary text-sm font-display font-semibold border border-primary/30"
                    >
                      + Add "{query.trim()}" as strength
                    </button>
                    <button
                      onClick={() => addItem(query.trim(), "cardio")}
                      className="col-span-2 py-2.5 rounded-md bg-primary/10 text-primary text-sm font-display font-semibold border border-primary/30"
                    >
                      + Add "{query.trim()}" as cardio
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                <button
                  onClick={() => setPickerCategory(null)}
                  className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:bg-muted/50"
                >
                  ← Back
                </button>
                {filteredPreset.map((name) => (
                  <button
                    key={name}
                    onClick={() => addItem(name, pickerCategory === "cardio" ? "cardio" : "strength")}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 border-t border-border/50"
                  >
                    {name}
                  </button>
                ))}
                {query.trim() && (
                  <button
                    onClick={() => addItem(query.trim(), pickerCategory === "cardio" ? "cardio" : "strength")}
                    className="w-full text-left px-4 py-2.5 text-sm text-primary border-t border-border/50 hover:bg-muted/50"
                  >
                    + Add "{query.trim()}"
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function NumField({
  label,
  value,
  step = 1,
  onCommit,
}: {
  label: string;
  value: number | null;
  step?: number;
  onCommit: (v: number) => void;
}) {
  const [local, setLocal] = useState(value == null ? "" : String(value));
  useEffect(() => setLocal(value == null ? "" : String(value)), [value]);
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <Input
        type="number"
        inputMode="decimal"
        step={step}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          const n = parseFloat(local);
          onCommit(isNaN(n) ? 0 : n);
        }}
        className="bg-background/60 border-border h-9 text-sm text-center mt-1"
      />
    </label>
  );
}
