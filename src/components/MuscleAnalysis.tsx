import { useMemo } from "react";
import { motion } from "framer-motion";
import { Target, AlertTriangle } from "lucide-react";
import type { Workout } from "@/lib/workoutStore";
import { EXERCISES } from "@/lib/exercises";

interface MuscleAnalysisProps {
  workouts: Workout[];
}

// Map exercises to specific muscle groups
const EXERCISE_MUSCLES: Record<string, string[]> = {
  "Bench Press": ["Chest", "Triceps", "Shoulders"],
  "Incline Bench Press": ["Upper Chest", "Shoulders", "Triceps"],
  "Decline Bench Press": ["Lower Chest", "Triceps"],
  "Dumbbell Chest Press": ["Chest", "Triceps"],
  "Overhead Press": ["Shoulders", "Triceps"],
  "Dumbbell Shoulder Press": ["Shoulders", "Triceps"],
  "Chest Fly Machine": ["Chest"],
  "Cable Fly": ["Chest"],
  "Tricep Pushdown": ["Triceps"],
  "Skull Crushers": ["Triceps"],
  "Dips": ["Chest", "Triceps"],
  "Lateral Raises": ["Shoulders"],
  "Pec Deck": ["Chest"],
  "Deadlift": ["Back", "Hamstrings", "Glutes"],
  "Barbell Row": ["Back", "Biceps"],
  "Lat Pulldown": ["Back", "Biceps"],
  "Seated Cable Row": ["Back", "Biceps"],
  "Pull-Ups": ["Back", "Biceps"],
  "Chin-Ups": ["Back", "Biceps"],
  "Face Pulls": ["Rear Delts", "Back"],
  "T-Bar Row": ["Back", "Biceps"],
  "Dumbbell Row": ["Back", "Biceps"],
  "Barbell Curl": ["Biceps"],
  "Dumbbell Curl": ["Biceps"],
  "Hammer Curl": ["Biceps", "Forearms"],
  "Cable Curl": ["Biceps"],
  "Squat": ["Quads", "Glutes", "Hamstrings"],
  "Front Squat": ["Quads", "Core"],
  "Leg Press": ["Quads", "Glutes"],
  "Hack Squat": ["Quads"],
  "Romanian Deadlift": ["Hamstrings", "Glutes", "Back"],
  "Leg Extension": ["Quads"],
  "Leg Curl": ["Hamstrings"],
  "Bulgarian Split Squat": ["Quads", "Glutes"],
  "Lunges": ["Quads", "Glutes", "Hamstrings"],
  "Hip Thrust": ["Glutes", "Hamstrings"],
  "Calf Raises": ["Calves"],
  "Goblet Squat": ["Quads", "Glutes", "Core"],
};

const ALL_MUSCLE_GROUPS = [
  "Chest", "Upper Chest", "Lower Chest",
  "Shoulders", "Rear Delts",
  "Back",
  "Biceps", "Triceps", "Forearms",
  "Quads", "Hamstrings", "Glutes", "Calves",
  "Core",
];

// Colors for the bar chart
const MUSCLE_COLORS: Record<string, string> = {
  Chest: "bg-red-400", "Upper Chest": "bg-red-300", "Lower Chest": "bg-red-500",
  Shoulders: "bg-amber-400", "Rear Delts": "bg-amber-300",
  Back: "bg-blue-400",
  Biceps: "bg-violet-400", Triceps: "bg-violet-300", Forearms: "bg-violet-500",
  Quads: "bg-orange-400", Hamstrings: "bg-orange-300", Glutes: "bg-orange-500", Calves: "bg-orange-200",
  Core: "bg-emerald-400",
};

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function MuscleAnalysis({ workouts }: MuscleAnalysisProps) {
  const { muscleCounts, maxCount, missing } = useMemo(() => {
    const now = new Date();
    const weekStart = getWeekStart(now);

    // Filter workouts from this week
    const thisWeek = workouts.filter((w) => new Date(w.date) >= weekStart);

    // Count sets per muscle group
    const counts = new Map<string, number>();
    for (const w of thisWeek) {
      const muscles = EXERCISE_MUSCLES[w.name];
      if (muscles) {
        for (const m of muscles) {
          counts.set(m, (counts.get(m) || 0) + w.sets.length);
        }
      } else {
        // Try to match from EXERCISES list for custom exercises with known category
        const known = EXERCISES.find((e) => e.name === w.name);
        if (known) {
          const catMuscles =
            known.category === "push" ? ["Chest", "Shoulders", "Triceps"] :
            known.category === "pull" ? ["Back", "Biceps"] :
            ["Quads", "Glutes", "Hamstrings"];
          for (const m of catMuscles) {
            counts.set(m, (counts.get(m) || 0) + w.sets.length);
          }
        }
      }
    }

    const max = Math.max(...Array.from(counts.values()), 1);

    // Find missing major muscle groups
    const majorGroups = ["Chest", "Shoulders", "Back", "Biceps", "Triceps", "Quads", "Hamstrings", "Glutes", "Core"];
    const missingMuscles = majorGroups.filter((m) => !counts.has(m));

    return { muscleCounts: counts, maxCount: max, missing: missingMuscles };
  }, [workouts]);

  const sortedMuscles = Array.from(muscleCounts.entries()).sort((a, b) => b[1] - a[1]);

  if (sortedMuscles.length === 0 && missing.length === 0) return null;

  return (
    <div className="px-4 pb-6">
      <div className="flex items-center gap-2 px-2 mb-3">
        <Target className="w-4 h-4 text-primary" />
        <span className="text-sm font-display font-semibold text-primary tracking-wide uppercase">
          This Week's Muscles
        </span>
      </div>

      {sortedMuscles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-lg p-4 mb-3"
        >
          <div className="space-y-2.5">
            {sortedMuscles.map(([muscle, count], i) => (
              <motion.div
                key={muscle}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground">{muscle}</span>
                  <span className="text-xs text-muted-foreground">{count} sets</span>
                </div>
                <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / maxCount) * 100}%` }}
                    transition={{ delay: i * 0.03 + 0.1, duration: 0.4 }}
                    className={`h-full rounded-full ${MUSCLE_COLORS[muscle] || "bg-primary"}`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {missing.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-display font-semibold text-amber-400">Missing This Week</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {missing.map((m) => (
              <span
                key={m}
                className="px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-400 text-xs font-medium"
              >
                {m}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            Try to hit all major muscle groups each week for balanced development 💪
          </p>
        </motion.div>
      )}
    </div>
  );
}
