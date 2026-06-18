// Parse Garmin .fit files and convert them into cardio/workout entries.
import FitParser from "fit-file-parser";
import { saveLocalCardio, saveLocalWorkout } from "./localStore";
import type { WorkoutSet } from "./workoutStore";

export interface FitImportResult {
  cardioAdded: number;
  workoutsAdded: number;
  summary: string;
}

const CARDIO_SPORTS = new Set([
  "running", "cycling", "walking", "hiking", "swimming", "rowing",
  "elliptical", "stand_up_paddleboarding", "paddling", "inline_skating",
  "skating", "skiing", "cross_country_skiing", "snowboarding",
  "fitness_equipment",
]);

const STRENGTH_SUB_SPORTS = new Set([
  "strength_training", "weight_training", "indoor_weightlifting",
  "bodyweight",
]);

const SPORT_NAMES: Record<string, string> = {
  running: "Run",
  cycling: "Cycling",
  walking: "Walk",
  hiking: "Hike",
  swimming: "Swim",
  rowing: "Rowing",
  elliptical: "Elliptical",
  training: "Strength",
  strength_training: "Strength",
  fitness_equipment: "Cardio",
  generic: "Activity",
};

function parseFit(buf: ArrayBuffer): Promise<any> {
  const parser = new FitParser({
    force: true,
    speedUnit: "km/h",
    lengthUnit: "km",
    temperatureUnit: "celsius",
    elapsedRecordField: true,
    mode: "list",
  });
  return new Promise((resolve, reject) => {
    parser.parse(buf, (err: any, data: any) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

function toISODate(d: any): string {
  const dt = d ? new Date(d) : new Date();
  return isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
}

function extractSets(source: any[]): WorkoutSet[] {
  return (source || [])
    .filter((x) => {
      const t = (x.set_type ?? "").toString().toLowerCase();
      if (t === "rest") return false;
      return (x.repetitions ?? x.reps ?? 0) > 0 || (x.weight ?? 0) > 0;
    })
    .map((x) => ({
      reps: Math.round(Number(x.repetitions ?? x.reps ?? 0)),
      weight: Math.round(Number(x.weight ?? 0) * 100) / 100,
    }))
    .filter((s) => s.reps > 0 || s.weight > 0);
}

export async function importFitFile(file: File): Promise<FitImportResult> {
  const buf = await file.arrayBuffer();
  const data = await parseFit(buf);

  // fit-file-parser exposes sets at the top level in "list" mode
  const topSets: any[] = data.sets || data.set_messages || [];
  const sessions: any[] = data.sessions || [];
  const activity = data.activity || {};
  const list = sessions.length ? sessions : [activity];

  let cardioAdded = 0;
  let workoutsAdded = 0;
  const titleParts: string[] = [];

  for (const s of list) {
    const sport = (s.sport || "generic").toString().toLowerCase();
    const subSport = (s.sub_sport || "").toString().toLowerCase();
    const startTime = s.start_time || s.timestamp || activity.timestamp;
    const date = toISODate(startTime);
    const durationSec = Math.round(s.total_timer_time ?? s.total_elapsed_time ?? 0);
    const durationMin = Math.max(0, Math.round(durationSec / 60));
    const distanceKm = s.total_distance != null ? Number(s.total_distance) : null;
    const calories = s.total_calories != null ? Math.round(Number(s.total_calories)) : null;

    // Session sets if attached, otherwise top-level sets
    const sessionSets = extractSets(s.sets || []);
    const fallbackSets = sessionSets.length === 0 ? extractSets(topSets) : [];
    const sets = sessionSets.length ? sessionSets : fallbackSets;

    const looksLikeStrength =
      STRENGTH_SUB_SPORTS.has(subSport) ||
      sport === "training" ||
      sport === "strength_training" ||
      sets.length > 0 ||
      // Heuristic: indoor / no distance but has timer = likely strength
      (!CARDIO_SPORTS.has(sport) && (!distanceKm || distanceKm < 0.05) && durationSec > 0);

    if (looksLikeStrength) {
      const finalSets = sets.length
        ? sets
        : [{ reps: 0, weight: 0 }]; // placeholder so user can edit
      const name = SPORT_NAMES[subSport] || SPORT_NAMES[sport] || "Strength (Garmin)";
      saveLocalWorkout({ name, sets: finalSets, date, photo: null });
      workoutsAdded++;
      titleParts.push(`${name} · ${finalSets.length} set${finalSets.length === 1 ? "" : "s"}`);
      continue;
    }

    const name = SPORT_NAMES[sport] || sport.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    saveLocalCardio({
      name,
      duration: durationMin,
      distance: distanceKm,
      calories,
      date,
    });
    cardioAdded++;
    titleParts.push(
      `${name} ${durationMin}min${distanceKm ? ` · ${distanceKm.toFixed(2)}km` : ""}`,
    );
  }

  // Helpful diagnostics during testing
  if (cardioAdded + workoutsAdded === 0) {
    console.warn("[fitImport] No sessions found in file", { keys: Object.keys(data) });
  }

  return {
    cardioAdded,
    workoutsAdded,
    summary: titleParts.join(", ") || "No activity data found",
  };
}
