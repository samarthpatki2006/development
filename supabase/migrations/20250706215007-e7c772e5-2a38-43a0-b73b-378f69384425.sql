
-- Create tables for course and academic management
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    course_code TEXT NOT NULL,
    course_name TEXT NOT NULL,
    description TEXT,
    credits INTEGER DEFAULT 0,
    semester TEXT,
    academic_year TEXT,
    instructor_id UUID REFERENCES public.user_profiles(id),
    max_students INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(college_id, course_code)
);

-- Create enrollment table
CREATE TABLE public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT DEFAULT 'enrolled',
    grade TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(course_id, student_id)
);

-- Create facilities table
CREATE TABLE public.facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    facility_name TEXT NOT NULL,
    facility_type TEXT NOT NULL, -- 'classroom', 'lab', 'auditorium', 'library', etc.
    capacity INTEGER,
    location TEXT,
    amenities JSONB DEFAULT '{}',
    is_available BOOLEAN DEFAULT true,
    maintenance_schedule JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    description TEXT,
    event_type TEXT, -- 'academic', 'cultural', 'sports', 'orientation', etc.
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    max_participants INTEGER,
    organizer_id UUID REFERENCES public.user_profiles(id),
    registration_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create finance and fees tables
CREATE TABLE public.fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    fee_type TEXT NOT NULL, -- 'tuition', 'hostel', 'transport', 'exam', etc.
    amount DECIMAL(10,2) NOT NULL,
    academic_year TEXT NOT NULL,
    semester TEXT,
    user_type TEXT, -- 'student', 'staff', etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.fee_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    fee_structure_id UUID NOT NULL REFERENCES public.fee_structures(id),
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    payment_method TEXT, -- 'cash', 'card', 'online', 'bank_transfer'
    transaction_id TEXT,
    status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'refunded'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create communication tables
CREATE TABLE public.communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.user_profiles(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    communication_type TEXT NOT NULL, -- 'email', 'sms', 'push', 'announcement'
    target_audience JSONB DEFAULT '{}', -- user_types, specific users, etc.
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'sent', 'failed'
    delivery_stats JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user onboarding table for tracking email status
CREATE TABLE public.user_onboarding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    temp_password TEXT NOT NULL,
    welcome_email_sent BOOLEAN DEFAULT false,
    welcome_email_delivered BOOLEAN DEFAULT false,
    welcome_email_opened BOOLEAN DEFAULT false,
    welcome_email_failed BOOLEAN DEFAULT false,
    first_login_completed BOOLEAN DEFAULT false,
    password_reset_required BOOLEAN DEFAULT true,
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, college_id)
);

-- Create content management table
CREATE TABLE public.content_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_type TEXT NOT NULL, -- 'document', 'video', 'image', 'link', 'announcement'
    content_url TEXT,
    description TEXT,
    category TEXT, -- 'academic', 'administrative', 'student_life', etc.
    access_level TEXT DEFAULT 'public', -- 'public', 'students', 'faculty', 'staff', 'specific'
    target_users JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create system settings table
CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    setting_category TEXT NOT NULL, -- 'general', 'security', 'academic', 'communication', etc.
    setting_key TEXT NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    updated_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(college_id, setting_category, setting_key)
);

-- Create analytics table for tracking metrics
CREATE TABLE public.analytics_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL, -- 'user_activity', 'course_enrollment', 'event_attendance', etc.
    metric_data JSONB NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    academic_year TEXT,
    semester TEXT
);

-- Enable RLS on all new tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the new tables
-- Courses policies
CREATE POLICY "College users can view courses" ON public.courses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.college_id = courses.college_id
        )
    );

CREATE POLICY "Admins can manage courses" ON public.courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.college_id = courses.college_id
            AND (up.user_type = 'admin' OR EXISTS (
                SELECT 1 FROM public.admin_roles ar 
                WHERE ar.user_id = auth.uid() 
                AND ar.college_id = courses.college_id
                AND ar.admin_role_type IN ('super_admin', 'course_management_admin')
                AND ar.is_active = true
            ))
        )
    );

-- Similar policies for other tables (abbreviated for brevity)
CREATE POLICY "College users can view facilities" ON public.facilities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.college_id = facilities.college_id
        )
    );

CREATE POLICY "Facility admins can manage facilities" ON public.facilities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.college_id = facilities.college_id
            AND (up.user_type = 'admin' OR EXISTS (
                SELECT 1 FROM public.admin_roles ar 
                WHERE ar.user_id = auth.uid() 
                AND ar.college_id = facilities.college_id
                AND ar.admin_role_type IN ('super_admin', 'estate_logistics_admin')
                AND ar.is_active = true
            ))
        )
    );

-- Function to generate unique user codes
CREATE OR REPLACE FUNCTION public.generate_user_code(
    college_code TEXT,
    user_type_param TEXT
) RETURNS TEXT AS $$
DECLARE
    year_suffix TEXT;
    type_prefix TEXT;
    sequence_num INTEGER;
    user_code TEXT;
BEGIN
    -- Get current year suffix (last 2 digits)
    year_suffix := RIGHT(EXTRACT(YEAR FROM NOW())::TEXT, 2);
    
    -- Set type prefix based on user type
    type_prefix := CASE 
        WHEN user_type_param = 'student' THEN 'S'
        WHEN user_type_param = 'faculty' THEN 'F'
        WHEN user_type_param = 'staff' THEN 'T'
        WHEN user_type_param = 'admin' THEN 'A'
        WHEN user_type_param = 'parent' THEN 'P'
        WHEN user_type_param = 'alumni' THEN 'L'
        ELSE 'U'
    END;
    
    -- Get next sequence number for this college and type
    SELECT COALESCE(MAX(
        CAST(RIGHT(user_code, 4) AS INTEGER)
    ), 0) + 1
    INTO sequence_num
    FROM public.user_profiles up
    JOIN public.colleges c ON c.id = up.college_id
    WHERE c.code = college_code
    AND up.user_type = user_type_param::public.user_type_enum;
    
    -- Format: COLLEGE_CODE + TYPE_PREFIX + YEAR + SEQUENCE (4 digits)
    user_code := college_code || type_prefix || year_suffix || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN user_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate temporary password
CREATE OR REPLACE FUNCTION public.generate_temp_password() RETURNS TEXT AS $$
BEGIN
    -- Generate a random 8-character password with mixed case and numbers
    RETURN array_to_string(
        ARRAY(
            SELECT chr(
                CASE 
                    WHEN random() < 0.33 THEN 48 + floor(random() * 10)::int -- 0-9
                    WHEN random() < 0.66 THEN 65 + floor(random() * 26)::int -- A-Z
                    ELSE 97 + floor(random() * 26)::int -- a-z
                END
            )
            FROM generate_series(1, 8)
        ), 
        ''
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
