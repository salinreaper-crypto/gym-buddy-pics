import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Dumbbell } from "lucide-react";
import { getWorkouts, type Workout } from "@/lib/workoutStore";
import WorkoutCard from "@/components/WorkoutCard";
import AddWorkoutSheet from "@/components/AddWorkoutSheet";
import WorkoutDetail from "@/components/WorkoutDetail";

export default function Index() {
  const [workouts, setWorkouts] = useState<Workout[]>(getWorkouts);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<Workout | null>(null);

  const refresh = useCallback(() => setWorkouts(getWorkouts()), []);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-6 pt-14 pb-6">
        <p className="text-sm text-primary font-medium tracking-wider uppercase">Your Gym</p>
        <h1 className="text-3xl font-bold mt-1">Workouts</h1>
      </div>

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
