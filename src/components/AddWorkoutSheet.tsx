import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Camera, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveWorkout, type WorkoutSet } from "@/lib/workoutStore";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  EXERCISES,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type ExerciseCategory,
} from "@/lib/exercises";

interface AddWorkoutSheetProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddWorkoutSheet({ open, onClose, onSaved }: AddWorkoutSheetProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [sets, setSets] = useState<WorkoutSet[]>([{ reps: 10, weight: 0 }]);
  const [photo, setPhoto] = useState<string | undefined>();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<ExerciseCategory | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setName("");
    setSets([{ reps: 10, weight: 0 }]);
    setPhoto(undefined);
    setPickerOpen(false);
    setExpandedCategory(null);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const updateSet = (i: number, field: keyof WorkoutSet, value: string) => {
    const n = parseInt(value) || 0;
    setSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: n } : s)));
  };

  const addSet = () => setSets((prev) => [...prev, { reps: 10, weight: prev[prev.length - 1]?.weight ?? 0 }]);
  const removeSet = (i: number) => setSets((prev) => prev.filter((_, idx) => idx !== i));

  const selectExercise = (exerciseName: string) => {
    setName(exerciseName);
    setPickerOpen(false);
  };

  const toggleCategory = (cat: ExerciseCategory) => {
    setExpandedCategory((prev) => (prev === cat ? null : cat));
  };

  const handleSave = () => {
  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Enter a workout name", variant: "destructive" });
      return;
    }
    if (!user) return;
    await saveWorkout({
      name: name.trim(),
      sets,
      photo,
      date: new Date().toISOString(),
    }, user.id);
    reset();
    onSaved();
    onClose();
    toast({ title: "Workout logged! 💪" });
  };

  const categories: ExerciseCategory[] = ["push", "pull", "legs"];

  return (
    <AnimatePresence>
      {open && (
        <>
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
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-2xl bg-card border-t border-border p-6 pb-10"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold">Log Workout</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo */}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full h-40 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 mb-6 overflow-hidden hover:border-primary/50 transition-colors"
            >
              {photo ? (
                <img src={photo} alt="Machine" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Camera className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Tap to take a photo</span>
                </>
              )}
            </button>

            {/* Exercise Picker */}
            <div className="mb-6 relative">
              <button
                onClick={() => setPickerOpen(!pickerOpen)}
                className="w-full bg-secondary rounded-lg h-12 px-4 flex items-center justify-between text-base font-medium"
              >
                <span className={name ? "text-foreground" : "text-muted-foreground"}>
                  {name || "Select exercise..."}
                </span>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${pickerOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {pickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 rounded-lg bg-secondary border border-border overflow-hidden"
                  >
                    <div className="max-h-60 overflow-y-auto">
                      {categories.map((cat) => (
                        <div key={cat}>
                          <button
                            onClick={() => toggleCategory(cat)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border"
                          >
                            <span className={`font-display font-semibold text-sm uppercase tracking-wider ${CATEGORY_COLORS[cat]}`}>
                              {CATEGORY_LABELS[cat]}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedCategory === cat ? "rotate-180" : ""}`} />
                          </button>
                          <AnimatePresence>
                            {expandedCategory === cat && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                              >
                                {EXERCISES.filter((e) => e.category === cat).map((exercise) => (
                                  <button
                                    key={exercise.name}
                                    onClick={() => selectExercise(exercise.name)}
                                    className={`w-full text-left px-6 py-2.5 text-sm hover:bg-muted/50 transition-colors ${
                                      name === exercise.name ? "text-primary font-medium" : "text-foreground"
                                    }`}
                                  >
                                    {exercise.name}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                      {/* Custom option */}
                      <div className="px-4 py-3 border-t border-border">
                        <Input
                          placeholder="Or type a custom name..."
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="bg-muted/50 border-none h-10 text-sm placeholder:text-muted-foreground"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sets */}
            <div className="space-y-3 mb-6">
              <div className="grid grid-cols-[1fr_1fr_40px] gap-3 text-xs text-muted-foreground font-medium px-1">
                <span>REPS</span>
                <span>WEIGHT (kg)</span>
                <span />
              </div>
              {sets.map((s, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_40px] gap-3 items-center">
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={s.reps || ""}
                    onChange={(e) => updateSet(i, "reps", e.target.value)}
                    className="bg-secondary border-none h-11 text-center text-base"
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={s.weight || ""}
                    onChange={(e) => updateSet(i, "weight", e.target.value)}
                    className="bg-secondary border-none h-11 text-center text-base"
                  />
                  {sets.length > 1 && (
                    <button onClick={() => removeSet(i)} className="p-2 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addSet}
                className="flex items-center gap-2 text-sm text-primary font-medium px-1"
              >
                <Plus className="w-4 h-4" /> Add Set
              </button>
            </div>

            <Button
              onClick={handleSave}
              className="w-full h-12 text-base font-display font-bold bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
            >
              Save Workout
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
