import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trash2, Dumbbell, Plus, Pencil, Check, X, Timer, Play, Square } from "lucide-react";
import type { Workout, WorkoutSet } from "@/lib/workoutStore";
import { updateLocalWorkoutSets, deleteLocalWorkout } from "@/lib/localStore";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface WorkoutDetailProps {
  workout: Workout | null;
  onBack: () => void;
  onDeleted: () => void;
  onUpdated?: () => void;
}

export default function WorkoutDetail({ workout, onBack, onDeleted, onUpdated }: WorkoutDetailProps) {
  const [editing, setEditing] = useState(false);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const TIMER_OPTIONS = [60, 90, 120, 180, 300];
  const [timerDuration, setTimerDuration] = useState(120);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setTimerRunning(false);
    setTimeLeft(timerDuration);
  }, [timerDuration]);

  const startTimer = useCallback(() => {
    setTimeLeft(timerDuration);
    setTimerRunning(true);
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopTimer();
          toast({ title: "Rest over! 💪 Get back to it!" });
          return timerDuration;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer, timerDuration]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  if (!workout) return null;

  const displaySets = editing ? sets : workout.sets;
  const totalVolume = displaySets.reduce((sum, s) => sum + s.reps * s.weight, 0);
  const dateStr = new Date(workout.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const startEdit = () => {
    setSets([...workout.sets]);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const addSet = () => {
    setSets((prev) => [...prev, { reps: 10, weight: prev[prev.length - 1]?.weight ?? 0 }]);
  };

  const updateSet = (i: number, field: keyof WorkoutSet, value: string) => {
    const n = parseFloat(value) || 0;
    setSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: n } : s)));
  };

  const removeSet = (i: number) => {
    setSets((prev) => prev.filter((_, idx) => idx !== i));
  };

  const saveEdit = () => {
    if (sets.length === 0) {
      toast({ title: "Add at least one set", variant: "destructive" });
      return;
    }
    updateLocalWorkoutSets(workout.id, sets);
    workout.sets = sets;
    setEditing(false);
    onUpdated?.();
    toast({ title: "Workout updated! 💪" });
  };

  const handleDelete = () => {
    deleteLocalWorkout(workout.id);
    toast({ title: "Workout deleted" });
    onDeleted();
    onBack();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed inset-0 z-30 bg-background overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            {!editing && (
              <button onClick={startEdit} className="p-2 rounded-full hover:bg-secondary text-primary">
                <Pencil className="w-5 h-5" />
              </button>
            )}
            <button onClick={handleDelete} className="p-2 -mr-2 rounded-full hover:bg-secondary text-destructive">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Photo */}
        {workout.photo ? (
          <img src={workout.photo} alt={workout.name} className="w-full h-56 object-cover" />
        ) : (
          <div className="w-full h-56 bg-secondary flex items-center justify-center">
            <Dumbbell className="w-16 h-16 text-primary/30" />
          </div>
        )}

        <div className="p-6 space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold">{workout.name}</h1>
            <p className="text-muted-foreground mt-1">{dateStr}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-lg p-4 text-center">
              <p className="text-2xl font-display font-bold text-primary">{displaySets.length}</p>
              <p className="text-xs text-muted-foreground mt-1">SETS</p>
            </div>
            <div className="glass-card rounded-lg p-4 text-center">
              <p className="text-2xl font-display font-bold text-primary">{totalVolume.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">TOTAL KG</p>
            </div>
          </div>

          {/* Sets table */}
          <div className="glass-card rounded-lg overflow-hidden">
            <div className={`grid ${editing ? "grid-cols-4" : "grid-cols-3"} gap-4 p-4 text-xs text-muted-foreground font-medium border-b border-border`}>
              <span>SET</span>
              <span className="text-center">REPS</span>
              <span className="text-right">WEIGHT</span>
              {editing && <span />}
            </div>
            {displaySets.map((s, i) => (
              <div key={i} className={`grid ${editing ? "grid-cols-4" : "grid-cols-3"} gap-4 p-4 border-b border-border last:border-none items-center`}>
                <span className="font-medium">{i + 1}</span>
                {editing ? (
                  <>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={s.reps || ""}
                      onChange={(e) => updateSet(i, "reps", e.target.value)}
                      className="bg-secondary border-none h-9 text-center text-sm"
                    />
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={s.weight || ""}
                      onChange={(e) => updateSet(i, "weight", e.target.value)}
                      className="bg-secondary border-none h-9 text-center text-sm"
                    />
                    <button onClick={() => removeSet(i)} className="p-1 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-center">{s.reps}</span>
                    <span className="text-right">{s.weight} kg</span>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Rest Timer */}
          <div className="glass-card rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-primary" />
                <span className="font-display font-semibold text-sm">Rest Timer</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-mono text-2xl font-bold ${timeLeft <= 10 && timerRunning ? "text-destructive animate-pulse" : "text-foreground"}`}>
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                </span>
                {timerRunning ? (
                  <button onClick={stopTimer} className="p-2 rounded-full bg-destructive/10 text-destructive">
                    <Square className="w-5 h-5" />
                  </button>
                ) : (
                  <button onClick={startTimer} className="p-2 rounded-full bg-primary/10 text-primary">
                    <Play className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            {!timerRunning && (
              <div className="flex gap-2 mb-2">
                {TIMER_OPTIONS.map((sec) => (
                  <button
                    key={sec}
                    onClick={() => { setTimerDuration(sec); setTimeLeft(sec); }}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      timerDuration === sec
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {sec >= 60 ? `${sec / 60}m` : `${sec}s`}
                  </button>
                ))}
              </div>
            )}
            {timerRunning && (
              <div className="mt-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-1000"
                  style={{ width: `${(timeLeft / timerDuration) * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Edit actions */}
          {editing && (
            <div className="space-y-3">
              <button
                onClick={addSet}
                className="flex items-center gap-2 text-sm text-primary font-medium"
              >
                <Plus className="w-4 h-4" /> Add Set
              </button>
              <div className="flex gap-3">
                <button
                  onClick={cancelEdit}
                  className="flex-1 h-11 rounded-lg bg-secondary text-foreground font-medium flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Save
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
