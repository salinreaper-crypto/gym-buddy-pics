
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Workouts table
CREATE TABLE public.workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sets JSONB NOT NULL DEFAULT '[]'::jsonb,
  photo TEXT,
  workout_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own workouts" ON public.workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workouts" ON public.workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workouts" ON public.workouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workouts" ON public.workouts FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON public.workouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Cardio entries table
CREATE TABLE public.cardio_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL,
  distance DOUBLE PRECISION,
  calories INTEGER,
  entry_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.cardio_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own cardio" ON public.cardio_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cardio" ON public.cardio_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cardio" ON public.cardio_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cardio" ON public.cardio_entries FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_cardio_updated_at BEFORE UPDATE ON public.cardio_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_workouts_user_date ON public.workouts (user_id, workout_date DESC);
CREATE INDEX idx_cardio_user_date ON public.cardio_entries (user_id, entry_date DESC);
