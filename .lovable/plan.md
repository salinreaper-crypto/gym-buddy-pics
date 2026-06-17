# Workout Planner & Guided Sessions

Build a planning layer on top of the existing logger. You create reusable workout plans (a list of exercises with target sets/reps for a day or a week). Pressing **Start Workout** loads today's plan as a checklist — for each exercise you just confirm/adjust weights (or km for cardio), tap done, and **Complete Workout** saves everything in one shot.

## User flow

1. New **Plans** tab (bottom nav) → list of your plans.
2. Create plan → name it, pick **Single day** or **Weekly** (Mon–Sun slots).
3. Inside a plan day, add exercises from the existing picker. For each: target sets × reps × suggested weight (prefilled from history), or for cardio: target duration / distance.
4. On Home, the **Start Workout** button checks for today's plan:
   - If a plan exists for today's weekday → opens the **Guided Session** sheet preloaded with it.
   - If none → opens a small chooser ("Today has no plan — pick one / start blank").
5. **Guided Session** sheet shows each exercise as a card with set rows (reps + weight, +/- buttons, prefilled from plan & last session). Tap **Mark Done** on each card. A rest timer auto-starts between sets (configurable, default 90s, skippable).
6. **Complete Workout** button saves every completed exercise as a `workouts` / `cardio_entries` row in one batch, shows a summary toast, and closes.

## Data model (Lovable Cloud)

Two new tables:

- `workout_plans` — `name`, `kind` ('single' | 'weekly'), `user_id`
- `workout_plan_items` — `plan_id`, `day_of_week` (0–6, null for single-day), `position`, `exercise_name`, `kind` ('strength' | 'cardio'), `target_sets`, `target_reps`, `target_weight`, `target_duration_min`, `target_distance_km`

RLS: owner-only via `auth.uid() = user_id` (items via `plan_id` join). Local-first mirror in `localStore` like workouts, with the same pending-sync queue.

## UI / files

```
src/pages/Plans.tsx              new tab — list + create plan
src/components/PlanEditor.tsx    new — name, kind, day tabs, add/remove items
src/components/GuidedSessionSheet.tsx  new — runs a plan; +/- weights, mark done, rest timer, Complete
src/lib/plansStore.ts            new — CRUD + local mirror
src/lib/localStore.ts            extend pending sync with plans
src/components/BottomNav.tsx     add Plans tab (Dumbbell icon)
src/pages/Index.tsx              Start Workout → if today's plan, open GuidedSessionSheet; else chooser
```

The existing `AddWorkoutSheet` stays for ad-hoc single-exercise logging.

## Notes

- Weekday for "today's plan" uses local time, `getDay()`.
- Guided session saves use the same `saveLocalWorkout` / `saveLocalCardio` paths so sync, PRs, and history all keep working.
- Weight prefill priority: plan target → last session for that exercise → 0.
- Rest timer is a lightweight in-component interval; no audio (browser autoplay), just a visible countdown + haptic vibration on mobile when it hits 0.

Approve and I'll build it.