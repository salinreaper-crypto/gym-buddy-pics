import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Dumbbell, Trophy } from "lucide-react";
import { getWorkouts, type Workout } from "@/lib/workoutStore";
import WorkoutCard from "@/components/WorkoutCard";
import AddWorkoutSheet from "@/components/AddWorkoutSheet";
import WorkoutDetail from "@/components/WorkoutDetail";

function getPersonalRecords(workouts: Workout[]) {
  const prMap = new Map<string, { weight: number; reps: number; date: string }>();
  for (const w of workouts) {
    for (const s of w.sets) {
      const existing = prMap.get(w.name);
      if (!existing || s.weight > existing.weight) {
        prMap.set(w.name, { weight: s.weight, reps: s.reps, date: w.date });
      }
    }
  }
  return Array.from(prMap.entries()).map(([name, pr]) => ({ name, ...pr }));
}

export default function Index() {
  const [workouts, setWorkouts] = useState<Workout[]>(getWorkouts);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<Workout | null>(null);

  const refresh = useCallback(() => setWorkouts(getWorkouts()), []);
  const prs = useMemo(() => getPersonalRecords(workouts), [workouts]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-6 pt-14 pb-4">
        <p className="text-sm text-primary font-medium tracking-wider uppercase">Your Gym</p>
        <h1 className="text-3xl font-bold mt-1">Workouts</h1>
      </div>

      {/* PR Section */}
      {prs.length > 0 && (
        <div className="px-4 pb-6">
          <div className="flex items-center gap-2 px-2 mb-3">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-sm font-display font-semibold text-primary tracking-wide uppercase">Personal Records</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {prs.map((pr, i) => (
              <motion.div
                key={pr.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-lg p-4 min-w-[140px] flex-shrink-0"
              >
                <p className="text-xs text-muted-foreground truncate mb-1">{pr.name}</p>
                <p className="text-xl font-display font-bold text-primary">{pr.weight}<span className="text-sm text-muted-foreground ml-1">kg</span></p>
                <p className="text-xs text-muted-foreground mt-1">{pr.reps} reps</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Workout list */}
      <div className="px-4 space-y-3">
        {workouts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Dumbbell className="w-10 h-10 text-primary/40" />
            </div>
            <p className="text-muted-foreground text-lg">No workouts yet</p>
            <p className="text-muted-foreground text-sm mt-1">Tap + to log your first workout</p>
          </motion.div>
        ) : (
          workouts.map((w, i) => (
            <WorkoutCard key={w.id} workout={w} index={i} onClick={() => setSelected(w)} />
          ))
        )}
      </div>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setSheetOpen(true)}
        className="fixed bottom-8 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg glow-primary z-20"
      >
        <Plus className="w-7 h-7" />
      </motion.button>

      <AddWorkoutSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onSaved={refresh} />
      {selected && (
        <WorkoutDetail workout={selected} onBack={() => setSelected(null)} onDeleted={refresh} />
      )}
    </div>
  );
}