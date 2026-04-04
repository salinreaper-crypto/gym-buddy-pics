import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, Timer, Flame, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  CARDIO_EXERCISES,
  CARDIO_CATEGORY_LABELS,
  CARDIO_CATEGORY_COLORS,
} from "@/lib/cardioExercises";
import { type CustomExercise } from "@/lib/customExerciseStore";
import { saveLocalCardio, saveLocalCustomExercise, getLocalCustomExercises } from "@/lib/localStore";

interface AddCardioSheetProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddCardioSheet({ open, onClose, onSaved }: AddCardioSheetProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [calories, setCalories] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [customExercises, setCustomExercises] = useState<CustomExercise[]>([]);

  useEffect(() => {
    if (open) {
      setCustomExercises(getLocalCustomExercises("cardio"));
    }
  }, [open]);

  const reset = () => {
    setName("");
    setDuration("");
    setDistance("");
    setCalories("");
    setPickerOpen(false);
    setExpandedCategory(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Select a cardio exercise", variant: "destructive" });
      return;
    }
    if (!duration || parseInt(duration) <= 0) {
      toast({ title: "Enter duration", variant: "destructive" });
      return;
    }
    if (!user) return;
    const trimmed = name.trim();
    const isPreset = CARDIO_EXERCISES.some((e) => e.name === trimmed);
    if (!isPreset && expandedCategory && expandedCategory !== "custom") {
      saveLocalCustomExercise(trimmed, "cardio", expandedCategory);
    } else if (!isPreset) {
      saveLocalCustomExercise(trimmed, "cardio", "machine");
    }
    saveLocalCardio({
      name: trimmed,
      duration: parseInt(duration),
      distance: distance ? parseFloat(distance) : undefined,
      calories: calories ? parseInt(calories) : undefined,
      date: new Date().toISOString(),
    });
    reset();
    onSaved();
    onClose();
    toast({ title: "Cardio logged! 🏃" });
  };

  const categories = ["machine", "outdoor", "sport"];

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
              <h2 className="font-display text-xl font-bold">Log Cardio</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>

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
                    <div className="max-h-52 overflow-y-auto">
                      {categories.map((cat) => (
                        <div key={cat}>
                          <button
                            onClick={() => setExpandedCategory(expandedCategory === cat ? null : cat)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border"
                          >
                            <span className={`font-display font-semibold text-sm uppercase tracking-wider ${CARDIO_CATEGORY_COLORS[cat]}`}>
                              {CARDIO_CATEGORY_LABELS[cat]}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedCategory === cat ? "rotate-180" : ""}`} />
                          </button>
                          <AnimatePresence>
                            {expandedCategory === cat && (
                              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                                {CARDIO_EXERCISES.filter((e) => e.category === cat).map((exercise) => (
                                  <button
                                    key={exercise.name}
                                    onClick={() => { setName(exercise.name); setPickerOpen(false); }}
                                    className={`w-full text-left px-6 py-2.5 text-sm hover:bg-muted/50 transition-colors ${
                                      name === exercise.name ? "text-primary font-medium" : "text-foreground"
                                    }`}
                                  >
                                    {exercise.name}
                                  </button>
                                ))}
                                {customExercises.filter((e) => e.category === cat).map((exercise) => (
                                  <button
                                    key={exercise.id}
                                    onClick={() => { setName(exercise.name); setPickerOpen(false); }}
                                    className={`w-full text-left px-6 py-2.5 text-sm hover:bg-muted/50 transition-colors italic ${
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

            {/* Fields */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                  <Timer className="w-3 h-3" /> DURATION (min) *
                </label>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="30"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="bg-secondary border-none h-11 text-base"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> DISTANCE (km)
                  </label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="5.0"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    className="bg-secondary border-none h-11 text-base"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                    <Flame className="w-3 h-3" /> CALORIES
                  </label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="300"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    className="bg-secondary border-none h-11 text-base"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleSave}
              className="w-full h-12 text-base font-display font-bold bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
            >
              Save Cardio
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
