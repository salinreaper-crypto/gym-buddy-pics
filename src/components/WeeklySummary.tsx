import { useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, Dumbbell, HeartPulse, TrendingUp, Flame, Star } from "lucide-react";
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
  uniqueWorkoutDays: number;
  earned: boolean; // 3+ workout days
}

// Star color tiers based on consecutive months of consistency
const STAR_TIERS = [
  { months: 6, color: "text-red-400", label: "6+ months", bg: "bg-red-400/10" },
  { months: 5, color: "text-purple-400", label: "5 months", bg: "bg-purple-400/10" },
  { months: 4, color: "text-cyan-400", label: "4 months", bg: "bg-cyan-400/10" },
  { months: 3, color: "text-emerald-400", label: "3 months", bg: "bg-emerald-400/10" },
  { months: 2, color: "text-blue-400", label: "2 months", bg: "bg-blue-400/10" },
  { months: 1, color: "text-yellow-400", label: "1 month", bg: "bg-yellow-400/10" },
];

function getStarColor(consecutiveMonths: number) {
  for (const tier of STAR_TIERS) {
    if (consecutiveMonths >= tier.months) return tier;
  }
  return { color: "text-muted-foreground/50", label: "", bg: "bg-secondary" };
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
          uniqueWorkoutDays: 0,
          earned: false,
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
          uniqueWorkoutDays: 0,
          earned: false,
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

    // Calculate unique workout days per week
    const result = Array.from(weekMap.values()).sort(
      (a, b) => b.weekStart.getTime() - a.weekStart.getTime()
    );
    for (const week of result) {
      let workoutDays = 0;
      week.days.forEach((d) => {
        if (d.workouts > 0 || d.cardio > 0) workoutDays++;
      });
      week.uniqueWorkoutDays = workoutDays;
      week.earned = workoutDays >= 3;
    }
    return result;
  }, [workouts, cardioEntries]);

  // Calculate streak data: consecutive weeks with stars, grouped by month
  const { totalStars, consecutiveMonths } = useMemo(() => {
    if (weeks.length === 0) return { totalStars: 0, consecutiveMonths: 0 };

    // Sort oldest first for streak counting
    const sorted = [...weeks].sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());
    const total = sorted.filter((w) => w.earned).length;

    // Count consecutive earned weeks from the most recent going backwards
    let streak = 0;
    const reversed = [...weeks]; // already sorted newest first
    for (const w of reversed) {
      if (w.earned) streak++;
      else break;
    }

    // 4 consecutive earned weeks ≈ 1 month of consistency
    const months = Math.floor(streak / 4);

    return { totalStars: total, consecutiveMonths: months };
  }, [weeks]);

  if (weeks.length === 0) return null;

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
  const tierInfo = getStarColor(consecutiveMonths);

  return (
    <div className="px-4 pb-6">
      <div className="flex items-center gap-2 px-2 mb-3">
        <Calendar className="w-4 h-4 text-primary" />
        <span className="text-sm font-display font-semibold text-primary tracking-wide uppercase">
          Weekly Summary
        </span>
      </div>

      {/* Star Progress Banner */}
      {totalStars > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-lg p-4 mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className={`w-5 h-5 fill-current ${consecutiveMonths >= 1 ? tierInfo.color : "text-yellow-400"}`} />
              <span className="font-display font-bold text-sm">Consistency Stars</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {totalStars} star{totalStars !== 1 ? "s" : ""} earned
            </span>
          </div>

          {/* Star display - show last 8 weeks */}
          <div className="flex items-center gap-1.5 mb-3">
            {weeks.slice(0, 8).reverse().map((week) => (
              <div key={week.weekStart.toISOString()} className="flex flex-col items-center gap-1">
                <Star
                  className={`w-6 h-6 ${
                    week.earned
                      ? `fill-current ${consecutiveMonths >= 1 ? tierInfo.color : "text-yellow-400"}`
                      : "text-muted-foreground/20"
                  }`}
                />
                <span className="text-[8px] text-muted-foreground">
                  {week.weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>

          {/* Streak info */}
          {consecutiveMonths >= 1 && (
            <div className={`rounded-md px-3 py-2 ${tierInfo.bg} flex items-center gap-2`}>
              <div className="flex gap-0.5">
                {Array.from({ length: Math.min(consecutiveMonths, 6) }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 fill-current ${tierInfo.color}`} />
                ))}
              </div>
              <span className={`text-xs font-semibold ${tierInfo.color}`}>
                {tierInfo.label} streak!
              </span>
            </div>
          )}

          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-2">
            {STAR_TIERS.slice().reverse().map((tier) => (
              <div key={tier.months} className="flex items-center gap-1">
                <Star className={`w-3 h-3 fill-current ${tier.color}`} />
                <span className="text-[10px] text-muted-foreground">{tier.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        {weeks.map((week, i) => (
          <motion.div
            key={week.weekStart.toISOString()}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground font-medium">{week.label}</p>
              {week.earned && (
                <div className="flex items-center gap-1">
                  <Star className={`w-4 h-4 fill-current ${consecutiveMonths >= 1 ? tierInfo.color : "text-yellow-400"}`} />
                  <span className="text-[10px] text-muted-foreground">{week.uniqueWorkoutDays}/3 days</span>
                </div>
              )}
            </div>

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
