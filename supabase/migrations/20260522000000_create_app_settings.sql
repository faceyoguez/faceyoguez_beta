-- Create app_settings table for storing webinar links and other configuration
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to settings (like the webinar WhatsApp link)
CREATE POLICY "Allow public read access to app_settings" ON public.app_settings
    FOR SELECT USING (true);

-- Allow service_role (admin client) full access
CREATE POLICY "Allow service_role full access to app_settings" ON public.app_settings
    USING (true)
    WITH CHECK (true);
