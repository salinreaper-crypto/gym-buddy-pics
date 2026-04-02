import { useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, Dumbbell, HeartPulse, TrendingUp, Flame } from "lucide-react";
import type { Workout } from "@/lib/workoutStore";
import type { CardioEntry } from "@/lib/cardioStore";

interface WeeklySummaryProps {
  workouts: Workout[];
  cardioEntries: CardioEntry[];
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekRange(start: Date): string {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

interface WeekData {
  weekStart: Date;
  label: string;
  workoutCount: number;
  totalSets: number;
  totalVolume: number;
  cardioCount: number;
  totalDuration: number;
  totalCalories: number;
  days: Map<number, { workouts: number; cardio: number }>;
}

export default function WeeklySummary({ workouts, cardioEntries }: WeeklySummaryProps) {
  const weeks = useMemo(() => {
    const weekMap = new Map<string, WeekData>();

    for (const w of workouts) {
      const ws = getWeekStart(new Date(w.date));
      const key = ws.toISOString();
      if (!weekMap.has(key)) {
        weekMap.set(key, {
          weekStart: ws,
          label: formatWeekRange(ws),
          workoutCount: 0,
          totalSets: 0,
          totalVolume: 0,
          cardioCount: 0,
          totalDuration: 0,
          totalCalories: 0,
          days: new Map(),
        });
      }
      const week = weekMap.get(key)!;
      week.workoutCount++;
      week.totalSets += w.sets.length;
      week.totalVolume += w.sets.reduce((s, set) => s + set.reps * set.weight, 0);
      const dayOfWeek = new Date(w.date).getDay();
      const day = week.days.get(dayOfWeek) ?? { workouts: 0, cardio: 0 };
      day.workouts++;
      week.days.set(dayOfWeek, day);
    }

    for (const c of cardioEntries) {
      const ws = getWeekStart(new Date(c.date));
      const key = ws.toISOString();
      if (!weekMap.has(key)) {
        weekMap.set(key, {
          weekStart: ws,
          label: formatWeekRange(ws),
          workoutCount: 0,
          totalSets: 0,
          totalVolume: 0,
          cardioCount: 0,
          totalDuration: 0,
          totalCalories: 0,
          days: new Map(),
        });
      }
      const week = weekMap.get(key)!;
      week.cardioCount++;
      week.totalDuration += c.duration;
      week.totalCalories += c.calories ?? 0;
      const dayOfWeek = new Date(c.date).getDay();
      const day = week.days.get(dayOfWeek) ?? { workouts: 0, cardio: 0 };
      day.cardio++;
      week.days.set(dayOfWeek, day);
    }

    return Array.from(weekMap.values()).sort(
      (a, b) => b.weekStart.getTime() - a.weekStart.getTime()
    );
  }, [workouts, cardioEntries]);

  if (weeks.length === 0) return null;

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="px-4 pb-6">
      <div className="flex items-center gap-2 px-2 mb-3">
        <Calendar className="w-4 h-4 text-primary" />
        <span className="text-sm font-display font-semibold text-primary tracking-wide uppercase">
          Weekly Summary
        </span>
      </div>

      <div className="space-y-3">
        {weeks.map((week, i) => (
          <motion.div
            key={week.weekStart.toISOString()}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-lg p-4"
          >
            <p className="text-xs text-muted-foreground font-medium mb-3">{week.label}</p>

            {/* Day dots */}
            <div className="flex gap-2 mb-4">
              {dayLabels.map((label, dayIdx) => {
                const dayData = week.days.get(dayIdx);
                const hasWorkout = (dayData?.workouts ?? 0) > 0;
                const hasCardio = (dayData?.cardio ?? 0) > 0;
                const active = hasWorkout || hasCardio;
                return (
                  <div key={dayIdx} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-[10px] text-muted-foreground">{label}</span>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        hasWorkout && hasCardio
                          ? "bg-primary text-primary-foreground"
                          : hasWorkout
                          ? "bg-primary/30 text-primary"
                          : hasCardio
                          ? "bg-accent/30 text-accent"
                          : "bg-secondary text-muted-foreground/30"
                      }`}
                    >
                      {active ? "✓" : "·"}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {week.workoutCount > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-3.5 h-3.5 text-primary" />
                    <span className="text-sm">
                      <span className="font-semibold text-foreground">{week.workoutCount}</span>{" "}
                      <span className="text-muted-foreground">workouts</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    <span className="text-sm">
                      <span className="font-semibold text-foreground">{week.totalVolume.toLocaleString()}</span>{" "}
                      <span className="text-muted-foreground">kg</span>
                    </span>
                  </div>
                </>
              )}
              {week.cardioCount > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-3.5 h-3.5 text-primary" />
                    <span className="text-sm">
                      <span className="font-semibold text-foreground">{week.cardioCount}</span>{" "}
                      <span className="text-muted-foreground">cardio</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-primary" />
                    <span className="text-sm">
                      <span className="font-semibold text-foreground">{week.totalDuration}</span>{" "}
                      <span className="text-muted-foreground">min</span>
                    </span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
