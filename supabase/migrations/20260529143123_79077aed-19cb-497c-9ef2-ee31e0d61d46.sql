
CREATE TABLE public.nutrition_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  food TEXT NOT NULL,
  calories INTEGER NOT NULL,
  consumed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutrition_entries TO authenticated;
GRANT ALL ON public.nutrition_entries TO service_role;

ALTER TABLE public.nutrition_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own nutrition" ON public.nutrition_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own nutrition" ON public.nutrition_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own nutrition" ON public.nutrition_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own nutrition" ON public.nutrition_entries FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_nutrition_entries_updated_at
BEFORE UPDATE ON public.nutrition_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.calories_burnt_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  calories INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'garmin',
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, entry_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.calories_burnt_entries TO authenticated;
GRANT ALL ON public.calories_burnt_entries TO service_role;

ALTER TABLE public.calories_burnt_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own burnt" ON public.calories_burnt_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own burnt" ON public.calories_burnt_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own burnt" ON public.calories_burnt_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own burnt" ON public.calories_burnt_entries FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_calories_burnt_entries_updated_at
BEFORE UPDATE ON public.calories_burnt_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
