-- Create function to update timestamps (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create user_timetable table for custom timetable sessions
CREATE TABLE public.user_timetable (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  day TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  focus_area TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_timetable ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own timetable"
ON public.user_timetable
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own timetable"
ON public.user_timetable
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timetable"
ON public.user_timetable
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timetable"
ON public.user_timetable
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_timetable_updated_at
BEFORE UPDATE ON public.user_timetable
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default timetable for existing users
INSERT INTO public.user_timetable (user_id, day, time_slot, focus_area)
SELECT 
  p.id,
  unnest(ARRAY['Monday', 'Monday', 'Tuesday', 'Tuesday', 'Tuesday', 'Tuesday', 'Tuesday', 'Wednesday', 'Wednesday', 'Wednesday', 'Wednesday', 'Wednesday', 'Wednesday', 'Thursday', 'Thursday', 'Friday', 'Friday', 'Saturday', 'Saturday', 'Saturday', 'Sunday', 'Sunday', 'Sunday']) as day,
  unnest(ARRAY['8:30 am – 5:30 pm', '8:30 – 9:15 pm', '8:30 – 10:20 am', '11:30 – 12:15 pm', '12:30 – 1:15 pm', '2:45 – 5:30 pm', '8:30 – 9:15 pm', '8:30 – 9:30 am', '10:30 – 11:15 am', '11:30 – 12:15 pm', '12:30 – 1:15 pm', '2:45 – 5:30 pm', '8:30 – 9:00 pm', '10:20 am – 5:30 pm', '8:00 – 8:45 pm', '12:00 – 1:30 pm', '4:00 – 5:00 pm', '11:00 – 12:30 pm', '3:00 – 6:00 pm', '6:30 – 7:00 pm', '11:00 – 12:30 pm', '3:00 – 6:00 pm', '6:30 – 7:00 pm']) as time_slot,
  unnest(ARRAY['University (long day)', 'Light review (DBMS or Linear)', 'University', 'Linear Algebra practice', 'DBMS concepts/queries', 'University', 'DSA coding (1 problem)', 'University', 'DSA problem solving', 'DSA problem solving', 'Linear Algebra problem set', 'University', 'DBMS flashcards/summary', 'University', 'Light DSA (easy problem) OR Linear recap', 'DSA coding (focus session)', 'DBMS deep dive (queries, ER diagrams)', 'DSA focus session', 'MERN Stack Course', 'SE Principles / Business Writing', 'Linear Algebra problem-solving', 'MERN Stack Course', 'Technical Business Writing']) as focus_area
FROM public.profiles p;