export type ExerciseCategory = "push" | "pull" | "legs";

export interface Exercise {
  name: string;
  category: ExerciseCategory;
}

export const EXERCISES: Exercise[] = [
  // Push
  { name: "Bench Press", category: "push" },
  { name: "Incline Bench Press", category: "push" },
  { name: "Decline Bench Press", category: "push" },
  { name: "Dumbbell Chest Press", category: "push" },
  { name: "Overhead Press", category: "push" },
  { name: "Dumbbell Shoulder Press", category: "push" },
  { name: "Chest Fly Machine", category: "push" },
  { name: "Cable Fly", category: "push" },
  { name: "Tricep Pushdown", category: "push" },
  { name: "Skull Crushers", category: "push" },
  { name: "Dips", category: "push" },
  { name: "Lateral Raises", category: "push" },
  { name: "Pec Deck", category: "push" },

  // Pull
  { name: "Deadlift", category: "pull" },
  { name: "Barbell Row", category: "pull" },
  { name: "Lat Pulldown", category: "pull" },
  { name: "Seated Cable Row", category: "pull" },
  { name: "Pull-Ups", category: "pull" },
  { name: "Chin-Ups", category: "pull" },
  { name: "Face Pulls", category: "pull" },
  { name: "T-Bar Row", category: "pull" },
  { name: "Dumbbell Row", category: "pull" },
  { name: "Barbell Curl", category: "pull" },
  { name: "Dumbbell Curl", category: "pull" },
  { name: "Hammer Curl", category: "pull" },
  { name: "Cable Curl", category: "pull" },

  // Legs
  { name: "Squat", category: "legs" },
  { name: "Front Squat", category: "legs" },
  { name: "Leg Press", category: "legs" },
  { name: "Hack Squat", category: "legs" },
  { name: "Romanian Deadlift", category: "legs" },
  { name: "Leg Extension", category: "legs" },
  { name: "Leg Curl", category: "legs" },
  { name: "Bulgarian Split Squat", category: "legs" },
  { name: "Lunges", category: "legs" },
  { name: "Hip Thrust", category: "legs" },
  { name: "Calf Raises", category: "legs" },
  { name: "Goblet Squat", category: "legs" },
];

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  push: "Push",
  pull: "Pull",
  legs: "Legs",
};

export const CATEGORY_COLORS: Record<ExerciseCategory, string> = {
  push: "text-primary",
  pull: "text-blue-400",
  legs: "text-orange-400",
};
