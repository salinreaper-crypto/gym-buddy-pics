import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Trash2, Utensils, Flame, TrendingDown, TrendingUp, Beef } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  type NutritionEntry,
  type BurntEntry,
  getCachedNutrition,
  getCachedBurnt,
  pullNutrition,
  pullBurnt,
  addNutrition,
  deleteNutrition,
  upsertBurnt,
  estimateCalories,
} from "@/lib/nutritionStore";

function todayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function nowLocalTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function dateKeyOf(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function prettyDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}
function prettyTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function NutritionTab() {
  const { user } = useAuth();
  const [nutrition, setNutrition] = useState<NutritionEntry[]>(getCachedNutrition());
  const [burnt, setBurnt] = useState<BurntEntry[]>(getCachedBurnt());

  const [food, setFood] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [time, setTime] = useState(nowLocalTime());
  const [date, setDate] = useState(todayLocalDate());
  const [estimating, setEstimating] = useState(false);
  const [saving, setSaving] = useState(false);

  const today = todayLocalDate();
  const todayBurnt = burnt.find((b) => b.entry_date === today);
  const [burntInput, setBurntInput] = useState<string>(todayBurnt ? String(todayBurnt.calories) : "");

  useEffect(() => {
    pullNutrition().then(setNutrition).catch(() => {});
    pullBurnt().then((b) => {
      setBurnt(b);
      const t = b.find((x) => x.entry_date === today);
      if (t) setBurntInput(String(t.calories));
    }).catch(() => {});
  }, [today]);

  const handleEstimate = async () => {
    if (!food.trim()) {
      toast({ title: "Enter a food first", variant: "destructive" });
      return;
    }
    setEstimating(true);
    try {
      const { calories: kcal, protein: prot, note } = await estimateCalories(food.trim());
      setCalories(String(kcal));
      setProtein(String(prot));
      const summary = `${kcal} kcal · ${prot}g protein`;
      if (note) toast({ title: `Estimated ${summary}`, description: note });
      else toast({ title: `Estimated ${summary}` });
    } catch (e: any) {
      toast({ title: "Estimation failed", description: e?.message ?? "", variant: "destructive" });
    } finally {
      setEstimating(false);
    }
  };

  const handleAdd = async () => {
    if (!user) return;
    const kcal = parseInt(calories, 10);
    const prot = parseInt(protein, 10);
    if (!food.trim() || !Number.isFinite(kcal) || kcal < 0) {
      toast({ title: "Food and calories required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const [h, m] = time.split(":").map(Number);
      const [y, mo, d] = date.split("-").map(Number);
      const consumed_at = new Date(y, mo - 1, d, h || 0, m || 0).toISOString();
      const entry = await addNutrition(
        user.id,
        food.trim(),
        kcal,
        consumed_at,
        Number.isFinite(prot) && prot >= 0 ? prot : 0,
      );
      setNutrition((prev) => [entry, ...prev]);
      setFood(""); setCalories(""); setProtein(""); setTime(nowLocalTime());
      toast({ title: "Logged 🍽️" });
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message ?? "", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteNutrition(id);
    setNutrition((prev) => prev.filter((n) => n.id !== id));
  };

  const handleSaveBurnt = async () => {
    if (!user) return;
    const kcal = parseInt(burntInput, 10);
    if (!Number.isFinite(kcal) || kcal < 0) {
      toast({ title: "Enter a valid number", variant: "destructive" });
      return;
    }
    try {
      const entry = await upsertBurnt(user.id, today, kcal);
      setBurnt((prev) => {
        const rest = prev.filter((b) => b.entry_date !== today);
        return [entry, ...rest];
      });
      toast({ title: "Saved 🔥" });
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message ?? "", variant: "destructive" });
    }
  };

  // Group nutrition by date
  const grouped = useMemo(() => {
    const map = new Map<string, NutritionEntry[]>();
    for (const n of nutrition) {
      const k = dateKeyOf(n.consumed_at);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(n);
    }
    // sort entries within day by time desc
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(b.consumed_at).getTime() - new Date(a.consumed_at).getTime());
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [nutrition]);

  const burntByDate = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of burnt) m.set(b.entry_date, b.calories);
    return m;
  }, [burnt]);

  const todayEntries = grouped.find(([k]) => k === today)?.[1] ?? [];
  const todayConsumed = todayEntries.reduce((s, n) => s + n.calories, 0);
  const todayProtein = todayEntries.reduce((s, n) => s + (n.protein ?? 0), 0);
  const todayBurntVal = burntByDate.get(today) ?? 0;
  const todayNet = todayConsumed - todayBurntVal;

  return (
    <div className="px-4 space-y-4">
      {/* Today summary */}
      <div className="grid grid-cols-4 gap-2">
        <div className="glass-card rounded-lg p-3 text-center">
          <Utensils className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Consumed</p>
          <p className="text-lg font-display font-bold">{todayConsumed}</p>
        </div>
        <div className="glass-card rounded-lg p-3 text-center">
          <Beef className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Protein</p>
          <p className="text-lg font-display font-bold">{todayProtein}<span className="text-xs font-normal text-muted-foreground">g</span></p>
        </div>
        <div className="glass-card rounded-lg p-3 text-center">
          <Flame className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Burnt</p>
          <p className="text-lg font-display font-bold">{todayBurntVal}</p>
        </div>
        <div className="glass-card rounded-lg p-3 text-center">
          {todayNet >= 0 ? (
            <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
          ) : (
            <TrendingDown className="w-4 h-4 text-primary mx-auto mb-1" />
          )}
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Net</p>
          <p className={`text-lg font-display font-bold ${todayNet < 0 ? "text-primary" : ""}`}>
            {todayNet > 0 ? "+" : ""}{todayNet}
          </p>
        </div>
      </div>

      {/* Add food */}
      <div className="glass-card rounded-lg p-4 space-y-3">
        <p className="text-sm font-display font-semibold tracking-wide uppercase text-muted-foreground">Log food</p>
        <Input
          placeholder="e.g. 2 slices wheat toast with peanut butter"
          value={food}
          onChange={(e) => setFood(e.target.value)}
        />
        <div className="flex gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Calories"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className="flex-1"
          />
          <Button type="button" variant="secondary" onClick={handleEstimate} disabled={estimating}>
            <Sparkles className="w-4 h-4 mr-1" />
            {estimating ? "..." : "Estimate"}
          </Button>
        </div>
        <div className="flex gap-2">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1" />
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="flex-1" />
        </div>
        <Button onClick={handleAdd} disabled={saving} className="w-full">
          {saving ? "Saving..." : "Add entry"}
        </Button>
      </div>

      {/* Burnt today */}
      <div className="glass-card rounded-lg p-4 space-y-3">
        <p className="text-sm font-display font-semibold tracking-wide uppercase text-muted-foreground">
          Calories burnt today (Garmin)
        </p>
        <div className="flex gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="e.g. 2450"
            value={burntInput}
            onChange={(e) => setBurntInput(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSaveBurnt}>Save</Button>
        </div>
      </div>

      {/* History grouped by day */}
      <div className="space-y-3">
        {grouped.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-3">
              <Utensils className="w-8 h-8 text-primary/40" />
            </div>
            <p className="text-muted-foreground">No food logged yet</p>
          </motion.div>
        ) : (
          grouped.map(([key, entries]) => {
            const consumed = entries.reduce((s, n) => s + n.calories, 0);
            const burntK = burntByDate.get(key) ?? 0;
            const net = consumed - burntK;
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-display font-semibold text-muted-foreground">{prettyDate(key)}</span>
                  <span className="text-xs text-muted-foreground">
                    <span className="text-foreground font-semibold">{consumed}</span> in
                    {" / "}
                    <span className="text-foreground font-semibold">{burntK}</span> out
                    {" / "}
                    <span className={`font-semibold ${net < 0 ? "text-primary" : "text-foreground"}`}>
                      {net > 0 ? "+" : ""}{net}
                    </span>
                  </span>
                </div>
                {entries.map((n, i) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="glass-card rounded-lg p-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{n.food}</p>
                      <p className="text-xs text-muted-foreground">{prettyTime(n.consumed_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-display font-bold text-primary">{n.calories}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">kcal</p>
                    </div>
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="p-2 rounded-md hover:bg-secondary text-muted-foreground"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
