import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type WorkoutPlan, itemsForDay, DAY_LABELS_FULL } from "@/lib/plansStore";

interface Props {
  open: boolean;
  plans: WorkoutPlan[];
  onClose: () => void;
  onPickPlan: (plan: WorkoutPlan, dayOfWeek: number) => void;
  onStartBlank: () => void;
  onGoToPlans: () => void;
}

export default function StartWorkoutChooser({ open, plans, onClose, onPickPlan, onStartBlank, onGoToPlans }: Props) {
  const today = new Date().getDay();
  const todaysPlans = plans
    .map((p) => ({ plan: p, items: itemsForDay(p, today) }))
    .filter((x) => x.items.length > 0);

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
            className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-card border-t border-border p-6 pb-10"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs uppercase tracking-wider text-primary font-display font-semibold">
                  {DAY_LABELS_FULL[today]}
                </p>
                <h2 className="font-display text-xl font-bold mt-0.5">Start Workout</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>

            {todaysPlans.length > 0 ? (
              <div className="space-y-2 mb-5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-display font-semibold px-1">
                  Today's Plans
                </p>
                {todaysPlans.map(({ plan, items }) => (
                  <button
                    key={plan.id}
                    onClick={() => onPickPlan(plan, today)}
                    className="w-full flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/30 hover:bg-primary/15 transition-colors text-left"
                  >
                    <div className="min-w-0">
                      <p className="font-display font-bold text-base truncate">{plan.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {items.length} exercise{items.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                      <Play className="w-4 h-4 ml-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 mb-4">
                <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No plan scheduled for today</p>
              </div>
            )}

            <div className="space-y-2">
              <Button onClick={onStartBlank} variant="outline" className="w-full h-11">
                <Plus className="w-4 h-4 mr-2" /> Log a single exercise
              </Button>
              <Button onClick={onGoToPlans} variant="ghost" className="w-full h-10 text-sm">
                Manage plans →
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
