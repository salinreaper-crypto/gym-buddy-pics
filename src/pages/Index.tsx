import { useState, useCallback, useMemo, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { Plus, Dumbbell, Trophy, HeartPulse, LogOut, RefreshCw, Cloud, Utensils } from "lucide-react";
import NutritionTab from "@/components/NutritionTab";
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
import MuscleAnalysis from "@/components/MuscleAnalysis";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

import { getPersonalRecords } from "@/lib/personalRecords";

type Tab = "weights" | "cardio" | "nutrition" | "weekly";

export default function Index() {
  const { user, signOut, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("weights");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [cardioEntries, setCardioEntries] = useState<CardioEntry[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cardioSheetOpen, setCardioSheetOpen] = useState(false);
  const [selected, setSelected] = useState<Workout | null>(null);
  const [editingCardio, setEditingCardio] = useState<CardioEntry | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const refreshLocal = useCallback(() => {
    setWorkouts(getLocalWorkouts());
    setCardioEntries(getLocalCardio());
    setPendingCount(getPendingCount());
  }, []);

  // Load local data immediately, then sync from cloud in background
  useEffect(() => {
    refreshLocal();
  }, [refreshLocal]);

  useEffect(() => {
    if (loading) return;
    pullFromCloud().then(refreshLocal).catch(() => {});
  }, [loading, refreshLocal]);
  const todayKey = new Date().toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set([todayKey]));

  const workoutsByDate = useMemo(() => {
    const grouped = new Map<string, Workout[]>();
    for (const w of workouts) {
      const dateKey = new Date(w.date).toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric", year: "numeric",
      });
      if (!grouped.has(dateKey)) grouped.set(dateKey, []);
      grouped.get(dateKey)!.push(w);
    }
    return Array.from(grouped.entries());
  }, [workouts]);

  const toggleDate = (date: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

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
            onClick={() => setTab("nutrition")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-display font-semibold transition-colors ${
              tab === "nutrition" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Utensils className="w-4 h-4" /> Food
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
              <div className="flex items-center justify-between px-2 mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span className="text-sm font-display font-semibold text-primary tracking-wide uppercase">
                    Personal Records
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{prs.length} lift{prs.length > 1 ? "s" : ""}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {prs.map((pr, i) => (
                  <motion.div
                    key={pr.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="glass-card rounded-lg p-3 border border-border/50"
                  >
                    <p className="text-xs text-muted-foreground truncate mb-1" title={pr.name}>{pr.name}</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-display font-bold text-primary leading-none">{pr.weight}</p>
                      <span className="text-xs text-muted-foreground">kg</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
                      <span>{pr.reps} reps</span>
                      <span>{new Date(pr.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </div>
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
              workoutsByDate.map(([dateKey, dateWorkouts]) => (
                <div key={dateKey}>
                  <button
                    onClick={() => toggleDate(dateKey)}
                    className="w-full flex items-center justify-between py-2 px-1 text-left"
                  >
                    <span className="text-sm font-display font-semibold text-muted-foreground">{dateKey}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{dateWorkouts.length} workout{dateWorkouts.length > 1 ? "s" : ""}</span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedDates.has(dateKey) ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {expandedDates.has(dateKey) && (
                    <div className="space-y-2 pb-2">
                      {dateWorkouts.map((w, i) => (
                        <WorkoutCard key={w.id} workout={w} index={i} onClick={() => setSelected(w)} />
                      ))}
                    </div>
                  )}
                </div>
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
            (() => {
              const grouped = new Map<string, CardioEntry[]>();
              for (const e of cardioEntries) {
                const dateKey = new Date(e.date).toLocaleDateString("en-US", {
                  weekday: "short", month: "short", day: "numeric", year: "numeric",
                });
                if (!grouped.has(dateKey)) grouped.set(dateKey, []);
                grouped.get(dateKey)!.push(e);
              }
              return Array.from(grouped.entries()).map(([dateKey, entries]) => (
                <div key={dateKey}>
                  <button
                    onClick={() => toggleDate(dateKey)}
                    className="w-full flex items-center justify-between py-2 px-1 text-left"
                  >
                    <span className="text-sm font-display font-semibold text-muted-foreground">{dateKey}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{entries.length} session{entries.length > 1 ? "s" : ""}</span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedDates.has(dateKey) ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {expandedDates.has(dateKey) && (
                    <div className="space-y-2 pb-2">
                      {entries.map((e, i) => (
                        <CardioCard key={e.id} entry={e} index={i} onDelete={handleDeleteCardio} onEdit={(entry) => { setEditingCardio(entry); setCardioSheetOpen(true); }} />
                      ))}
                    </div>
                  )}
                </div>
              ));
            })()
          )}
        </div>
      )}

      {tab === "nutrition" && <NutritionTab />}

      {tab === "weekly" && (
        <>
          <MuscleAnalysis workouts={workouts} />
          <WeeklySummary workouts={workouts} cardioEntries={cardioEntries} />
        </>
      )}

      {/* FAB - only on weights/cardio */}
      {(tab === "weights" || tab === "cardio") && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => tab === "weights" ? setSheetOpen(true) : setCardioSheetOpen(true)}
          className="fixed bottom-8 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg glow-primary z-20"
        >
          <Plus className="w-7 h-7" />
        </motion.button>
      )}

      <AddWorkoutSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onSaved={refreshLocal} workouts={workouts} />
      <AddCardioSheet open={cardioSheetOpen} onClose={() => { setCardioSheetOpen(false); setEditingCardio(null); }} onSaved={refreshLocal} editEntry={editingCardio} />
      {selected && (
        <WorkoutDetail workout={selected} onBack={() => setSelected(null)} onDeleted={refreshLocal} onUpdated={refreshLocal} />
      )}
    </div>
  );
}
