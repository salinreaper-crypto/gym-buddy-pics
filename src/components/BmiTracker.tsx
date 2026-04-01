import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Scale, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const BMI_KEY = "bmi_data";

interface BmiData {
  height: number; // cm
  weight: number; // kg
}

function getBmiData(): BmiData | null {
  const raw = localStorage.getItem(BMI_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function saveBmiData(data: BmiData) {
  localStorage.setItem(BMI_KEY, JSON.stringify(data));
}

function calcBmi(height: number, weight: number) {
  const m = height / 100;
  return weight / (m * m);
}

function getBmiLabel(bmi: number) {
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-400" };
  if (bmi < 25) return { label: "Normal", color: "text-primary" };
  if (bmi < 30) return { label: "Overweight", color: "text-orange-400" };
  return { label: "Obese", color: "text-destructive" };
}

function getBmiBarPercent(bmi: number) {
  // Map BMI 15–40 to 0–100%
  return Math.min(100, Math.max(0, ((bmi - 15) / 25) * 100));
}

export default function BmiTracker() {
  const [data, setData] = useState<BmiData | null>(getBmiData);
  const [editing, setEditing] = useState(false);
  const [height, setHeight] = useState(data?.height?.toString() ?? "");
  const [weight, setWeight] = useState(data?.weight?.toString() ?? "");

  const handleSave = () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w || h <= 0 || w <= 0) return;
    const newData = { height: h, weight: w };
    saveBmiData(newData);
    setData(newData);
    setEditing(false);
  };

  const bmi = data ? calcBmi(data.height, data.weight) : null;
  const bmiInfo = bmi ? getBmiLabel(bmi) : null;

  if (!data && !editing) {
    return (
      <div className="px-4 pb-6">
        <button
          onClick={() => setEditing(true)}
          className="w-full glass-card rounded-lg p-5 flex items-center gap-4 hover:border-primary/30 transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
            <Scale className="w-6 h-6 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-display font-semibold">Track your BMI</p>
            <p className="text-sm text-muted-foreground">Tap to enter height & weight</p>
          </div>
        </button>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="px-4 pb-6">
        <div className="glass-card rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              <span className="font-display font-semibold text-sm uppercase tracking-wide text-primary">BMI Calculator</span>
            </div>
            <button onClick={() => setEditing(false)} className="p-1 rounded-full hover:bg-secondary">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">HEIGHT (cm)</label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="175"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="bg-secondary border-none h-11 text-center text-base"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">WEIGHT (kg)</label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="70"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="bg-secondary border-none h-11 text-center text-base"
              />
            </div>
          </div>
          <Button
            onClick={handleSave}
            className="w-full h-10 font-display font-bold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Calculate
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-lg p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary" />
            <span className="font-display font-semibold text-sm uppercase tracking-wide text-primary">BMI</span>
          </div>
          <button
            onClick={() => { setEditing(true); setHeight(data?.height?.toString() ?? ""); setWeight(data?.weight?.toString() ?? ""); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Update
          </button>
        </div>

        <div className="flex items-end gap-3 mb-3">
          <span className="text-4xl font-display font-bold">{bmi!.toFixed(1)}</span>
          <span className={`text-sm font-medium pb-1 ${bmiInfo!.color}`}>{bmiInfo!.label}</span>
        </div>

        {/* BMI bar */}
        <div className="relative h-2 rounded-full bg-secondary overflow-hidden mb-2">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-400 via-primary to-orange-400"
            style={{ width: "100%" }}
          />
          <motion.div
            initial={{ left: "0%" }}
            animate={{ left: `${getBmiBarPercent(bmi!)}%` }}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-foreground border-2 border-background shadow-md"
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>15</span>
          <span>18.5</span>
          <span>25</span>
          <span>30</span>
          <span>40</span>
        </div>

        <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
          <span>{data!.height} cm</span>
          <span>{data!.weight} kg</span>
        </div>
      </motion.div>
    </div>
  );
}