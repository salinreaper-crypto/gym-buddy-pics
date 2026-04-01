import { motion } from "framer-motion";
import { Dumbbell, ChevronRight } from "lucide-react";
import type { Workout } from "@/lib/workoutStore";

interface WorkoutCardProps {
  workout: Workout;
  onClick: () => void;
  index: number;
}

export default function WorkoutCard({ workout, onClick, index }: WorkoutCardProps) {
  const totalVolume = workout.sets.reduce((sum, s) => sum + s.reps * s.weight, 0);
  const dateStr = new Date(workout.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={onClick}
      className="w-full glass-card rounded-lg p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
    >
      {workout.photo ? (
        <img
          src={workout.photo}
          alt={workout.name}
          className="w-14 h-14 rounded-md object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-14 h-14 rounded-md bg-secondary flex items-center justify-center flex-shrink-0">
          <Dumbbell className="w-6 h-6 text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-display font-semibold text-foreground truncate">{workout.name}</h3>
        <p className="text-sm text-muted-foreground">
          {workout.sets.length} sets · {totalVolume.toLocaleString()} lbs · {dateStr}
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
    </motion.button>
  );
}
