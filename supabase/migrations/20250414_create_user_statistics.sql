-- Create user_statistics table
CREATE TABLE IF NOT EXISTS public.user_statistics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    statistics JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up RLS (Row Level Security) for the user_statistics table
ALTER TABLE public.user_statistics ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to access only their own statistics
CREATE POLICY "Users can only access their own statistics" 
    ON public.user_statistics 
    FOR ALL 
    USING (auth.uid() = user_id);

-- Allow authenticated users to select their statistics
GRANT SELECT ON public.user_statistics TO authenticated;

-- Allow authenticated users to insert their statistics
GRANT INSERT ON public.user_statistics TO authenticated;

-- Allow authenticated users to update their statistics
GRANT UPDATE ON public.user_statistics TO authenticated;

-- Add updated_at trigger function (if it doesn't exist already)
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_user_statistics_updated_at
    BEFORE UPDATE ON public.user_statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Create index on user_id for faster lookup
CREATE INDEX IF NOT EXISTS idx_user_statistics_user_id ON public.user_statistics(user_id);
