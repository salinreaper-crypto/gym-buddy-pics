
CREATE TABLE public.custom_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('workout', 'cardio')),
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, name, type)
);

ALTER TABLE public.custom_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own custom exercises" ON public.custom_exercises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own custom exercises" ON public.custom_exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own custom exercises" ON public.custom_exercises FOR DELETE USING (auth.uid() = user_id);
