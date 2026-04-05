import { useState, useCallback, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Dumbbell, Trophy, HeartPulse, LogOut, RefreshCw, Cloud } from "lucide-react";
import { type Workout } from "@/lib/workoutStore";
import { type CardioEntry } from "@/lib/cardioStore";
import {
  getLocalWorkouts,
  getLocalCardio,
  deleteLocalCardio,
  pullFromCloud,
  syncToCloud,
  hasPendingChanges,
  getPendingCount,
} from "@/lib/localStore";
import WorkoutCard from "@/components/WorkoutCard";
import AddWorkoutSheet from "@/components/AddWorkoutSheet";
import WorkoutDetail from "@/components/WorkoutDetail";
import BmiTracker from "@/components/BmiTracker";
import AddCardioSheet from "@/components/AddCardioSheet";
import CardioCard from "@/components/CardioCard";
import WeeklySummary from "@/components/WeeklySummary";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

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

type Tab = "weights" | "cardio" | "weekly";

export default function Index() {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>("weights");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [cardioEntries, setCardioEntries] = useState<CardioEntry[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cardioSheetOpen, setCardioSheetOpen] = useState(false);
  const [selected, setSelected] = useState<Workout | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const refreshLocal = useCallback(() => {
    setWorkouts(getLocalWorkouts());
    setCardioEntries(getLocalCardio());
    setPendingCount(getPendingCount());
  }, []);

  // Wait for auth to be ready before pulling from cloud
  const { loading } = useAuth();
  useEffect(() => {
    if (loading) return;
    pullFromCloud().then(refreshLocal).catch(() => refreshLocal());
  }, [loading, refreshLocal]);

  const prs = useMemo(() => getPersonalRecords(workouts), [workouts]);

  const handleDeleteCardio = (id: string) => {
    deleteLocalCardio(id);
    refreshLocal();
  };

  const handleSync = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      const result = await syncToCloud(user.id);
      if (result.success) {
        toast({ title: `Synced ${result.synced} changes ☁️` });
      } else {
        toast({ title: `Synced ${result.synced} changes, some failed`, variant: "destructive" });
      }
      refreshLocal();
    } catch {
      toast({ title: "Sync failed", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-6 pt-14 pb-4 flex items-start justify-between">
        <div>
          <p className="text-sm text-primary font-medium tracking-wider uppercase">Your Gym</p>
          <h1 className="text-3xl font-bold mt-1">Workouts</h1>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="relative p-2 rounded-full hover:bg-secondary"
          >
            {syncing ? (
              <RefreshCw className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <Cloud className="w-5 h-5 text-muted-foreground" />
            )}
            {pendingCount > 0 && !syncing && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
          <button onClick={signOut} className="p-2 rounded-full hover:bg-secondary">
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pb-4">
        <div className="flex bg-secondary rounded-lg p-1">
          <button
            onClick={() => setTab("weights")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-display font-semibold transition-colors ${
              tab === "weights" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Dumbbell className="w-4 h-4" /> Weights
          </button>
          <button
            onClick={() => setTab("cardio")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-display font-semibold transition-colors ${
              tab === "cardio" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <HeartPulse className="w-4 h-4" /> Cardio
          </button>
          <button
            onClick={() => setTab("weekly")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-display font-semibold transition-colors ${
              tab === "weekly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Trophy className="w-4 h-4" /> Weekly
          </button>
        </div>
      </div>

      {tab === "weights" && (
        <>
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

          <BmiTracker />

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
        </>
      )}

      {tab === "cardio" && (
        <div className="px-4 space-y-3">
          {cardioEntries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                <HeartPulse className="w-10 h-10 text-primary/40" />
              </div>
              <p className="text-muted-foreground text-lg">No cardio yet</p>
              <p className="text-muted-foreground text-sm mt-1">Tap + to log your first session</p>
            </motion.div>
          ) : (
            cardioEntries.map((e, i) => (
              <CardioCard key={e.id} entry={e} index={i} onDelete={handleDeleteCardio} />
            ))
          )}
        </div>
      )}

      {tab === "weekly" && (
        <WeeklySummary workouts={workouts} cardioEntries={cardioEntries} />
      )}

      {/* FAB - hide on weekly tab */}
      {tab !== "weekly" && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => tab === "weights" ? setSheetOpen(true) : setCardioSheetOpen(true)}
          className="fixed bottom-8 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg glow-primary z-20"
        >
          <Plus className="w-7 h-7" />
        </motion.button>
      )}

      <AddWorkoutSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onSaved={refreshLocal} />
      <AddCardioSheet open={cardioSheetOpen} onClose={() => setCardioSheetOpen(false)} onSaved={refreshLocal} />
      {selected && (
        <WorkoutDetail workout={selected} onBack={() => setSelected(null)} onDeleted={refreshLocal} onUpdated={refreshLocal} />
      )}
    </div>
  );
}
