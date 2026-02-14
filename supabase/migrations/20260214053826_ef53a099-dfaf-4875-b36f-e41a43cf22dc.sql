
-- Create wardrobe_items table for user's closet
CREATE TABLE public.wardrobe_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  color TEXT,
  brand TEXT,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wardrobe" ON public.wardrobe_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their wardrobe" ON public.wardrobe_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their wardrobe items" ON public.wardrobe_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their wardrobe" ON public.wardrobe_items
  FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for wardrobe images
INSERT INTO storage.buckets (id, name, public) VALUES ('wardrobe', 'wardrobe', true);

CREATE POLICY "Users can upload wardrobe images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'wardrobe' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Wardrobe images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'wardrobe');

CREATE POLICY "Users can delete their wardrobe images" ON storage.objects
  FOR DELETE USING (bucket_id = 'wardrobe' AND auth.uid()::text = (storage.foldername(name))[1]);
