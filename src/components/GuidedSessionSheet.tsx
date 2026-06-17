import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Check, SkipForward, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type PlanItem, type WorkoutPlan, itemsForDay } from "@/lib/plansStore";
import { saveLocalWorkout, saveLocalCardio } from "@/lib/localStore";
import { type Workout, type WorkoutSet } from "@/lib/workoutStore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface SessionSet {
  reps: number;
  weight: number;
  done: boolean;
}

interface SessionItem {
  planItem: PlanItem;
  sets: SessionSet[]; // strength
  duration: number; // cardio mins
  distance: number; // cardio km
  done: boolean;
}

interface Props {
  plan: WorkoutPlan;
  dayOfWeek: number;
  recentWorkouts: Workout[];
  onClose: () => void;
  onSaved: () => void;
}

const REST_SECONDS = 90;

export default function GuidedSessionSheet({ plan, dayOfWeek, recentWorkouts, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const items = useMemo(() => itemsForDay(plan, dayOfWeek), [plan, dayOfWeek]);

  const [session, setSession] = useState<SessionItem[]>(() =>
    items.map((it) => {
      const lastWeight = lastWeightFor(recentWorkouts, it.exercise_name);
      const numSets = it.target_sets ?? 3;
      const reps = it.target_reps ?? 10;
      const weight = it.target_weight && it.target_weight > 0 ? it.target_weight : lastWeight;
      return {
        planItem: it,
        sets: Array.from({ length: numSets }, () => ({ reps, weight, done: false })),
        duration: it.target_duration_min ?? 20,
        distance: it.target_distance_km ?? 0,
        done: false,
      };
    }),
  );
  const [rest, setRest] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Rest countdown
  useState(() => {
    const id = setInterval(() => {
      setRest((r) => {
        if (r == null) return r;
        if (r <= 1) {
          if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(200);
          return null;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  });

  const toggleSet = (i: number, j: number) => {
    setSession((prev) =>
      prev.map((it, idx) => {
        if (idx !== i) return it;
        const wasDone = it.sets[j].done;
        const sets = it.sets.map((s, k) => (k === j ? { ...s, done: !s.done } : s));
        return { ...it, sets };
      }),
    );
    const wasDone = session[i].sets[j].done;
    if (!wasDone) setRest(REST_SECONDS);
  };

  const bumpSet = (i: number, j: number, field: "reps" | "weight", delta: number) => {
    setSession((prev) =>
      prev.map((it, idx) =>
        idx !== i
          ? it
          : {
              ...it,
              sets: it.sets.map((s, k) =>
                k === j ? { ...s, [field]: Math.max(0, +(s[field] + delta).toFixed(2)) } : s,
              ),
            },
      ),
    );
  };

  const updateSetField = (i: number, j: number, field: "reps" | "weight", value: string) => {
    const n = parseFloat(value) || 0;
    setSession((prev) =>
      prev.map((it, idx) =>
        idx !== i ? it : { ...it, sets: it.sets.map((s, k) => (k === j ? { ...s, [field]: n } : s)) },
      ),
    );
  };

  const addSet = (i: number) => {
    setSession((prev) =>
      prev.map((it, idx) => {
        if (idx !== i) return it;
        const last = it.sets[it.sets.length - 1] ?? { reps: 10, weight: 0, done: false };
        return { ...it, sets: [...it.sets, { reps: last.reps, weight: last.weight, done: false }] };
      }),
    );
  };

  const removeSet = (i: number, j: number) => {
    setSession((prev) =>
      prev.map((it, idx) => (idx !== i ? it : { ...it, sets: it.sets.filter((_, k) => k !== j) })),
    );
  };

  const updateCardio = (i: number, field: "duration" | "distance", value: string) => {
    const n = parseFloat(value) || 0;
    setSession((prev) => prev.map((it, idx) => (idx !== i ? it : { ...it, [field]: n })));
  };

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);
    let saved = 0;
    try {
      for (const it of session) {
        if (it.planItem.kind === "strength") {
          const completed: WorkoutSet[] = it.sets
            .filter((s) => s.done)
            .map((s) => ({ reps: s.reps, weight: s.weight }));
          if (completed.length === 0) continue;
          saveLocalWorkout({
            name: it.planItem.exercise_name,
            sets: completed,
            photo: undefined,
            date: new Date().toISOString(),
          });
          saved++;
        } else {
          if (it.duration <= 0 && it.distance <= 0) continue;
          saveLocalCardio({
            name: it.planItem.exercise_name,
            duration: it.duration,
            distance: it.distance || null,
            calories: null,
            date: new Date().toISOString(),
          });
          saved++;
        }
      }
      onSaved();
      onClose();
      toast({ title: saved > 0 ? `Workout complete! ${saved} logged 💪` : "Nothing logged" });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Couldn't complete workout", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const totalSets = session.reduce(
    (acc, it) => acc + (it.planItem.kind === "strength" ? it.sets.length : 0),
    0,
  );
  const doneSets = session.reduce(
    (acc, it) => acc + (it.planItem.kind === "strength" ? it.sets.filter((s) => s.done).length : 0),
    0,
  );
  const cardioDone = session.filter(
    (it) => it.planItem.kind === "cardio" && (it.duration > 0 || it.distance > 0),
  ).length;
  const cardioTotal = session.filter((it) => it.planItem.kind === "cardio").length;

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
        className="fixed inset-x-0 bottom-0 z-50 max-h-[95vh] flex flex-col rounded-t-2xl bg-card border-t border-border"
      >
        <div className="px-6 pt-6 pb-3 flex items-center justify-between border-b border-border">
          <div>
            <p className="text-xs uppercase tracking-wider text-primary font-display font-semibold">
              In Progress
            </p>
            <h2 className="font-display text-xl font-bold mt-0.5">{plan.name}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {doneSets}/{totalSets} sets · {cardioDone}/{cardioTotal} cardio
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {rest != null && (
          <div className="px-6 py-2 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-display font-semibold text-primary">
              <Timer className="w-4 h-4" /> Rest {rest}s
            </div>
            <button
              onClick={() => setRest(null)}
              className="text-xs text-primary flex items-center gap-1 font-medium"
            >
              Skip <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="overflow-y-auto px-4 py-4 space-y-4 flex-1">
          {session.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-12">
              No exercises planned for today.
            </p>
          )}
          {session.map((it, i) => (
            <div
              key={it.planItem.id}
              className="rounded-lg bg-secondary/40 border border-border p-4"
            >
              <div className="flex items-baseline justify-between mb-3">
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-base truncate">
                    {it.planItem.exercise_name}
                  </h3>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {it.planItem.kind}
                  </p>
                </div>
              </div>

              {it.planItem.kind === "strength" ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-[36px_1fr_1fr_36px_36px] gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider px-1">
                    <span>Set</span>
                    <span className="text-center">Reps</span>
                    <span className="text-center">Kg</span>
                    <span />
                    <span />
                  </div>
                  {it.sets.map((s, j) => (
                    <div
                      key={j}
                      className={`grid grid-cols-[36px_1fr_1fr_36px_36px] gap-1.5 items-center transition-opacity ${
                        s.done ? "opacity-60" : ""
                      }`}
                    >
                      <span className="text-sm font-display font-bold text-muted-foreground text-center">
                        {j + 1}
                      </span>
                      <StepperField
                        value={s.reps}
                        onChange={(v) => updateSetField(i, j, "reps", v)}
                        onMinus={() => bumpSet(i, j, "reps", -1)}
                        onPlus={() => bumpSet(i, j, "reps", 1)}
                      />
                      <StepperField
                        value={s.weight}
                        onChange={(v) => updateSetField(i, j, "weight", v)}
                        onMinus={() => bumpSet(i, j, "weight", -2.5)}
                        onPlus={() => bumpSet(i, j, "weight", 2.5)}
                        decimal
                      />
                      <button
                        onClick={() => toggleSet(i, j)}
                        className={`h-10 rounded-md flex items-center justify-center transition-colors ${
                          s.done
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                        aria-label={s.done ? "Mark undone" : "Mark done"}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeSet(i, j)}
                        disabled={it.sets.length <= 1}
                        className="h-10 rounded-md text-muted-foreground hover:text-destructive disabled:opacity-30"
                        aria-label="Remove set"
                      >
                        <Minus className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addSet(i)}
                    className="flex items-center gap-1.5 text-xs text-primary font-medium pt-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Set
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Mins</span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={it.duration || ""}
                      onChange={(e) => updateCardio(i, "duration", e.target.value)}
                      className="bg-background/60 border-border h-11 text-center mt-1"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Km</span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      value={it.distance || ""}
                      onChange={(e) => updateCardio(i, "distance", e.target.value)}
                      className="bg-background/60 border-border h-11 text-center mt-1"
                    />
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="px-6 pt-3 pb-8 border-t border-border bg-card">
          <Button
            onClick={handleComplete}
            disabled={saving}
            className="w-full h-12 text-base font-display font-bold bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
          >
            {saving ? "Saving…" : "Complete Workout"}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function StepperField({
  value,
  onChange,
  onMinus,
  onPlus,
  decimal,
}: {
  value: number;
  onChange: (v: string) => void;
  onMinus: () => void;
  onPlus: () => void;
  decimal?: boolean;
}) {
  return (
    <div className="flex items-center bg-secondary rounded-md h-10 overflow-hidden">
      <button
        type="button"
        onClick={onMinus}
        className="h-full px-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <Input
        type="number"
        inputMode={decimal ? "decimal" : "numeric"}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border-none h-full text-center text-sm p-0 focus-visible:ring-0"
      />
      <button
        type="button"
        onClick={onPlus}
        className="h-full px-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function lastWeightFor(workouts: Workout[], name: string): number {
  const key = name.trim().toLowerCase();
  const last = workouts.find((w) => w.name.trim().toLowerCase() === key);
  if (!last?.sets?.length) return 0;
  // Use the heaviest set from the most recent session
  return last.sets.reduce((m, s) => Math.max(m, s.weight || 0), 0);
}
