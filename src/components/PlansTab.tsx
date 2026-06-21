import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, Trash2, Pencil, Play, Repeat, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createPlan,
  deletePlan,
  getPlans,
  itemsForDay,
  DAY_LABELS,
  DAY_LABELS_FULL,
  type WorkoutPlan,
  type PlanKind,
} from "@/lib/plansStore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import PlanEditor from "./PlanEditor";

interface Props {
  onStartPlan: (plan: WorkoutPlan, dayOfWeek: number) => void;
}

export default function PlansTab({ onStartPlan }: Props) {
  const { user } = useAuth();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<PlanKind>("weekly");
  const [editing, setEditing] = useState<WorkoutPlan | null>(null);
  const today = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState<Record<string, number>>({});

  const refresh = async () => {
    try {
      setPlans(await getPlans());
    } catch {
      toast({ title: "Could not load plans", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [user?.id]);

  const handleCreate = async () => {
    if (!user || !newName.trim()) return;
    try {
      await createPlan(newName.trim(), newKind, user.id);
      setNewName("");
      setCreating(false);
      const fresh = await getPlans();
      setPlans(fresh);
      const created = fresh.find((p) => p.name === newName.trim());
      if (created) setEditing(created);
    } catch {
      toast({ title: "Could not create plan", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this plan?")) return;
    try {
      await deletePlan(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  return (
    <div className="px-4 space-y-4 pb-8">
      {!creating ? (
        <Button
          onClick={() => setCreating(true)}
          className="w-full h-12 font-display font-bold"
        >
          <Plus className="w-4 h-4 mr-2" /> New Plan
        </Button>
      ) : (
        <div className="bg-secondary/50 border border-border rounded-lg p-4 space-y-3">
          <Input
            autoFocus
            placeholder="Plan name (e.g. Push/Pull/Legs)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="bg-background/60 h-11"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setNewKind("weekly")}
              className={`p-3 rounded-md border text-left transition-colors ${
                newKind === "weekly"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background/40"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <Repeat className="w-3.5 h-3.5" />
                <span className="font-display font-semibold text-sm">Weekly</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Different plan for each day</p>
            </button>
            <button
              onClick={() => setNewKind("single")}
              className={`p-3 rounded-md border text-left transition-colors ${
                newKind === "single"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background/40"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-display font-semibold text-sm">Single Day</span>
              </div>
              <p className="text-[11px] text-muted-foreground">One reusable session</p>
            </button>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} className="flex-1" disabled={!newName.trim()}>Create</Button>
            <Button onClick={() => { setCreating(false); setNewName(""); }} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Calendar className="w-10 h-10 text-primary/40" />
          </div>
          <p className="text-muted-foreground text-lg">No plans yet</p>
          <p className="text-muted-foreground text-sm mt-1">Create a plan to guide your sessions</p>
        </div>
      ) : (
        plans.map((plan, i) => {
          const todaysItems = itemsForDay(plan, today);
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-lg bg-card border border-border p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-base truncate">{plan.name}</h3>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                    {plan.kind === "weekly" ? "Weekly · 7 days" : "Single-day routine"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditing(plan)}
                    className="p-1.5 text-muted-foreground hover:text-foreground"
                    aria-label="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {plan.kind === "weekly" ? (
                <div className="flex gap-1 mb-3">
                  {DAY_LABELS.map((label, idx) => {
                    const has = plan.items.some((it) => it.day_of_week === idx);
                    return (
                      <div
                        key={idx}
                        className={`flex-1 text-center py-1 rounded-md text-[10px] font-display font-bold tracking-wider uppercase ${
                          idx === today && has
                            ? "bg-primary text-primary-foreground"
                            : has
                            ? "bg-secondary text-foreground"
                            : "bg-secondary/40 text-muted-foreground"
                        }`}
                      >
                        {label}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mb-3">
                  {plan.items.length} exercise{plan.items.length === 1 ? "" : "s"}
                </p>
              )}

              {todaysItems.length > 0 && (
                <div className="space-y-2 mb-3">
                  {todaysItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 text-sm bg-secondary/40 rounded-md px-3 py-2"
                    >
                      <Dumbbell className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="font-medium truncate">{item.exercise_name}</span>
                      <span className="text-muted-foreground text-xs ml-auto shrink-0">
                        {item.kind === "strength"
                          ? `${item.target_sets ?? "—"}×${item.target_reps ?? "—"}` +
                            (item.target_weight ? ` @ ${item.target_weight}kg` : "")
                          : `${item.target_duration_min ?? "—"}min` +
                            (item.target_distance_km ? ` / ${item.target_distance_km}km` : "")}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={() => onStartPlan(plan, today)}
                disabled={todaysItems.length === 0}
                className="w-full h-10 font-display font-semibold"
                variant={todaysItems.length > 0 ? "default" : "outline"}
              >
                <Play className="w-4 h-4 mr-2" />
                {plan.kind === "weekly"
                  ? todaysItems.length > 0
                    ? `Start ${DAY_LABELS_FULL[today]} (${todaysItems.length})`
                    : `No exercises for ${DAY_LABELS_FULL[today]}`
                  : todaysItems.length > 0
                  ? `Start (${todaysItems.length})`
                  : "Add exercises first"}
              </Button>
            </motion.div>
          );
        })
      )}

      {editing && (
        <PlanEditor
          plan={editing}
          onClose={async () => { setEditing(null); await refresh(); }}
          onChanged={refresh}
        />
      )}
    </div>
  );
}
