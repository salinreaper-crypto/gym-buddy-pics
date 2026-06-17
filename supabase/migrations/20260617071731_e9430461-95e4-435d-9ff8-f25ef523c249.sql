
-- workout_plans
CREATE TABLE public.workout_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('single','weekly')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_plans TO authenticated;
GRANT ALL ON public.workout_plans TO service_role;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages plans" ON public.workout_plans
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_workout_plans_updated_at
  BEFORE UPDATE ON public.workout_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- workout_plan_items
CREATE TABLE public.workout_plan_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  day_of_week SMALLINT CHECK (day_of_week BETWEEN 0 AND 6),
  position INTEGER NOT NULL DEFAULT 0,
  exercise_name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('strength','cardio')),
  target_sets INTEGER,
  target_reps INTEGER,
  target_weight NUMERIC,
  target_duration_min INTEGER,
  target_distance_km NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_plan_items TO authenticated;
GRANT ALL ON public.workout_plan_items TO service_role;
ALTER TABLE public.workout_plan_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages plan items" ON public.workout_plan_items
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_plan_items_plan ON public.workout_plan_items(plan_id);
CREATE INDEX idx_plan_items_user_day ON public.workout_plan_items(user_id, day_of_week);
CREATE TRIGGER trg_workout_plan_items_updated_at
  BEFORE UPDATE ON public.workout_plan_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
