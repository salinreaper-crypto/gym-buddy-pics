export interface CardioExercise {
  name: string;
  category: "machine" | "outdoor" | "sport";
}

export const CARDIO_EXERCISES: CardioExercise[] = [
  // Machine
  { name: "Treadmill", category: "machine" },
  { name: "Elliptical", category: "machine" },
  { name: "Stationary Bike", category: "machine" },
  { name: "Rowing Machine", category: "machine" },
  { name: "Stairmaster", category: "machine" },
  { name: "Assault Bike", category: "machine" },
  { name: "Ski Erg", category: "machine" },

  // Outdoor
  { name: "Running", category: "outdoor" },
  { name: "Cycling", category: "outdoor" },
  { name: "Swimming", category: "outdoor" },
  { name: "Walking", category: "outdoor" },
  { name: "Hiking", category: "outdoor" },
  { name: "Jump Rope", category: "outdoor" },

  // Sport
  { name: "Basketball", category: "sport" },
  { name: "Soccer", category: "sport" },
  { name: "Boxing", category: "sport" },
  { name: "Tennis", category: "sport" },
  { name: "Rowing", category: "sport" },
];

export const CARDIO_CATEGORY_LABELS: Record<string, string> = {
  machine: "Machine",
  outdoor: "Outdoor",
  sport: "Sport",
};

export const CARDIO_CATEGORY_COLORS: Record<string, string> = {
  machine: "text-primary",
  outdoor: "text-blue-400",
  sport: "text-orange-400",
};
