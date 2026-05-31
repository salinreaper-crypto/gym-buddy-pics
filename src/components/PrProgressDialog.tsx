import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { Workout } from "@/lib/workoutStore";

interface PrProgressDialogProps {
  exerciseName: string | null;
  workouts: Workout[];
  onClose: () => void;
}

interface Point {
  date: string;
  ts: number;
  topWeight: number;
  reps: number;
  volume: number;
}

export default function PrProgressDialog({ exerciseName, workouts, onClose }: PrProgressDialogProps) {
  const data = useMemo<Point[]>(() => {
    if (!exerciseName) return [];
    const key = exerciseName.trim().toLowerCase();
    const points: Point[] = [];
    for (const w of workouts) {
      if (w.name.trim().toLowerCase() !== key) continue;
      let top = { weight: 0, reps: 0 };
      let vol = 0;
      for (const s of w.sets) {
        vol += s.reps * s.weight;
        if (s.weight > top.weight) top = { weight: s.weight, reps: s.reps };
      }
      points.push({
        date: new Date(w.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        ts: new Date(w.date).getTime(),
        topWeight: top.weight,
        reps: top.reps,
        volume: vol,
      });
    }
    return points.sort((a, b) => a.ts - b.ts);
  }, [exerciseName, workouts]);

  const stats = useMemo(() => {
    if (data.length === 0) return null;
    const pr = data.reduce((a, b) => (b.topWeight > a.topWeight ? b : a));
    const first = data[0];
    const last = data[data.length - 1];
    const delta = last.topWeight - first.topWeight;
    return { pr, first, last, delta, sessions: data.length };
  }, [data]);

  return (
    <AnimatePresence>
      {exerciseName && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[92vw] max-w-xl max-h-[88vh] overflow-y-auto rounded-2xl bg-card border border-border p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between mb-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-primary text-xs font-display font-semibold uppercase tracking-wider mb-1">
                  <Trophy className="w-3.5 h-3.5" /> Progress
                </div>
                <h2 className="font-display text-xl font-bold truncate">{exerciseName}</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary flex-shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {stats ? (
              <>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <StatCard label="Personal Record" value={`${stats.pr.topWeight} kg`} sub={`${stats.pr.reps} reps · ${stats.pr.date}`} />
                  <StatCard label="Latest" value={`${stats.last.topWeight} kg`} sub={`${stats.last.reps} reps · ${stats.last.date}`} />
                  <StatCard
                    label="Change"
                    value={`${stats.delta >= 0 ? "+" : ""}${stats.delta} kg`}
                    sub={`${stats.sessions} session${stats.sessions > 1 ? "s" : ""}`}
                    trend={stats.delta > 0 ? "up" : stats.delta < 0 ? "down" : "flat"}
                  />
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickLine={false} axisLine={false} width={36} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                        formatter={(v: number, n: string) => [n === "topWeight" ? `${v} kg` : v, n === "topWeight" ? "Top set" : n]}
                      />
                      <ReferenceLine y={stats.pr.topWeight} stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeOpacity={0.5} />
                      <Line
                        type="monotone"
                        dataKey="topWeight"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2.5}
                        dot={{ fill: "hsl(var(--primary))", r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">History</p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {[...data].reverse().map((p, i) => {
                      const isPr = p.topWeight === stats.pr.topWeight && p.ts === stats.pr.ts;
                      return (
                        <div
                          key={`${p.ts}-${i}`}
                          className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                            isPr ? "bg-primary/10 border border-primary/30" : "bg-secondary/60"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isPr && <Trophy className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                            <span className="text-muted-foreground">{p.date}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-muted-foreground">{p.reps} reps</span>
                            <span className="font-display font-bold text-foreground">
                              {p.topWeight}<span className="text-muted-foreground font-normal ml-0.5">kg</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No sessions yet.</p>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function StatCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string;
  sub: string;
  trend?: "up" | "down" | "flat";
}) {
  const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : trend === "flat" ? Minus : null;
  const color = trend === "up" ? "text-primary" : trend === "down" ? "text-destructive" : "text-muted-foreground";
  return (
    <div className="rounded-lg bg-secondary/60 border border-border/50 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-display font-semibold mb-1">{label}</p>
      <div className={`flex items-center gap-1 ${trend ? color : "text-foreground"}`}>
        {Icon && <Icon className="w-3.5 h-3.5" />}
        <p className="text-lg font-display font-bold leading-tight">{value}</p>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 truncate">{sub}</p>
    </div>
  );
}
