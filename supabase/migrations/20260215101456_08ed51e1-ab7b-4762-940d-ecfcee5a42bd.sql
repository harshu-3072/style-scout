
CREATE TABLE public.saved_looks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_looks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved looks" ON public.saved_looks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save looks" ON public.saved_looks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their saved looks" ON public.saved_looks FOR DELETE USING (auth.uid() = user_id);
