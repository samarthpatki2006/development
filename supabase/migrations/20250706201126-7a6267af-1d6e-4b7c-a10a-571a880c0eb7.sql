
-- Create enum for user types
CREATE TYPE public.user_type AS ENUM ('student', 'faculty', 'admin', 'parent', 'alumni');

-- Create colleges table
CREATE TABLE public.colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    logo TEXT,
    primary_color TEXT DEFAULT '#1e40af',
    secondary_color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create users table (extending auth.users with college-specific data)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    user_code TEXT NOT NULL,
    user_type public.user_type NOT NULL,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(college_id, user_code)
);

-- Insert sample colleges
INSERT INTO public.colleges (code, name, logo, primary_color, secondary_color) VALUES
('TAPMI', 'T.A. Pai Management Institute', '🎓', '#1e40af', '#3b82f6'),
('BITS', 'Birla Institute of Technology and Science', '🏛️', '#dc2626', '#ef4444'),
('IIMB', 'Indian Institute of Management Bangalore', '🏫', '#059669', '#10b981');

-- Enable RLS on colleges table
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_profiles table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for colleges table
-- Allow everyone to read college information (needed for login flow)
CREATE POLICY "Anyone can view colleges" ON public.colleges
    FOR SELECT USING (true);

-- Only authenticated users can modify colleges (admin functionality)
CREATE POLICY "Only authenticated users can modify colleges" ON public.colleges
    FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for user_profiles table
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Only system can insert user profiles (handled by triggers)
CREATE POLICY "System can insert user profiles" ON public.user_profiles
    FOR INSERT WITH CHECK (true);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id,
        college_id,
        user_code,
        user_type,
        first_name,
        last_name,
        email
    ) VALUES (
        NEW.id,
        (NEW.raw_user_meta_data->>'college_id')::UUID,
        NEW.raw_user_meta_data->>'user_code',
        (NEW.raw_user_meta_data->>'user_type')::public.user_type,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile when auth user is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to validate college and user code during login
CREATE OR REPLACE FUNCTION public.validate_college_user(
    college_code TEXT,
    user_code TEXT
) RETURNS TABLE (
    college_id UUID,
    college_name TEXT,
    college_logo TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    user_exists BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.logo,
        c.primary_color,
        c.secondary_color,
        EXISTS(
            SELECT 1 FROM public.user_profiles up 
            WHERE up.college_id = c.id 
            AND up.user_code = validate_college_user.user_code
            AND up.is_active = true
        ) as user_exists
    FROM public.colleges c
    WHERE c.code = college_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get college by code
CREATE OR REPLACE FUNCTION public.get_college_by_code(college_code TEXT)
RETURNS TABLE (
    id UUID,
    code TEXT,
    name TEXT,
    logo TEXT,
    primary_color TEXT,
    secondary_color TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.code, c.name, c.logo, c.primary_color, c.secondary_color
    FROM public.colleges c
    WHERE c.code = college_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
