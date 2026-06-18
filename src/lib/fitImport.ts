// Parse Garmin .fit files and convert them into cardio/workout entries.
import FitParser from "fit-file-parser";
import { saveLocalCardio, saveLocalWorkout } from "./localStore";
import type { WorkoutSet } from "./workoutStore";

export interface FitImportResult {
  cardioAdded: number;
  workoutsAdded: number;
  summary: string;
}

const SPORT_NAMES: Record<string, string> = {
  running: "Run",
  cycling: "Cycling",
  walking: "Walk",
  hiking: "Hike",
  swimming: "Swim",
  rowing: "Rowing",
  elliptical: "Elliptical",
  training: "Workout",
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
  return dt.toISOString();
}

export async function importFitFile(file: File): Promise<FitImportResult> {
  const buf = await file.arrayBuffer();
  const data = await parseFit(buf);

  const sessions: any[] = data.sessions || [];
  const activity = data.activity || {};
  let cardioAdded = 0;
  let workoutsAdded = 0;
  const titleParts: string[] = [];

  // Fallback: if no sessions, build one from activity-level fields.
  const list = sessions.length ? sessions : [activity];

  for (const s of list) {
    const sport: string = (s.sport || s.sub_sport || "generic").toString().toLowerCase();
    const name = SPORT_NAMES[sport] || sport.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const startTime = s.start_time || s.timestamp || activity.timestamp;
    const date = toISODate(startTime);

    if (sport === "training" || sport === "strength_training" || s.sub_sport === "strength_training") {
      // Try to read sets from laps/sets
      const setsRaw: any[] = data.sets || s.sets || [];
      const sets: WorkoutSet[] = setsRaw
        .filter((x) => x.set_type === "active" || x.reps || x.weight)
        .map((x) => ({
          reps: Math.round(x.repetitions ?? x.reps ?? 0),
          weight: Number(x.weight ?? 0),
        }))
        .filter((x) => x.reps > 0);

      if (sets.length > 0) {
        saveLocalWorkout({ name: "Strength (Garmin)", sets, date, photo: null });
        workoutsAdded++;
        titleParts.push(`${sets.length} sets`);
        continue;
      }
    }

    const durationSec = Math.round(s.total_timer_time ?? s.total_elapsed_time ?? 0);
    const durationMin = Math.max(0, Math.round(durationSec / 60));
    const distanceKm = s.total_distance != null ? Number(s.total_distance) : null;
    const calories = s.total_calories != null ? Math.round(Number(s.total_calories)) : null;

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

  return {
    cardioAdded,
    workoutsAdded,
    summary: titleParts.join(", ") || "No activity data found",
  };
}
