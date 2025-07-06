
-- Create enum for admin role types
CREATE TYPE public.admin_role_type AS ENUM (
    'super_admin',
    'course_management_admin', 
    'estate_logistics_admin',
    'event_admin',
    'finance_admin',
    'it_admin'
);

-- Create enum for general user hierarchy levels
CREATE TYPE public.user_hierarchy_level AS ENUM (
    'super_admin',      -- Level 1 (highest)
    'admin',            -- Level 2 
    'faculty',          -- Level 3
    'student',          -- Level 4
    'parent',           -- Level 5
    'alumni'            -- Level 6 (lowest)
);

-- Create admin_roles table for role assignments
CREATE TABLE public.admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    admin_role_type public.admin_role_type NOT NULL,
    assigned_by UUID REFERENCES public.user_profiles(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, college_id, admin_role_type)
);

-- Create audit_logs table for tracking admin actions
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    admin_user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    action_description TEXT,
    module TEXT, -- 'users', 'roles', 'courses', 'events', 'finance', etc.
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create security_settings table for 2FA and security policies
CREATE TABLE public.security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT,
    backup_codes TEXT[],
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, college_id)
);

-- Add hierarchy_level to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN hierarchy_level public.user_hierarchy_level DEFAULT 'student';

-- Update existing user types to hierarchy levels
UPDATE public.user_profiles 
SET hierarchy_level = CASE 
    WHEN user_type = 'admin' THEN 'admin'
    WHEN user_type = 'faculty' THEN 'faculty'
    WHEN user_type = 'student' THEN 'student'
    WHEN user_type = 'parent' THEN 'parent'
    WHEN user_type = 'alumni' THEN 'alumni'
    ELSE 'student'
END;

-- Enable RLS on new tables
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_roles
CREATE POLICY "Super admins can manage all admin roles" ON public.admin_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.admin_role_type = 'super_admin' 
            AND ar.is_active = true
            AND ar.college_id = admin_roles.college_id
        )
    );

CREATE POLICY "Admins can view their own roles" ON public.admin_roles
    FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for audit_logs  
CREATE POLICY "Super admins can view all audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.admin_role_type = 'super_admin' 
            AND ar.is_active = true
            AND ar.college_id = audit_logs.college_id
        )
    );

CREATE POLICY "Admins can view relevant audit logs" ON public.audit_logs
    FOR SELECT USING (
        admin_user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.is_active = true
            AND ar.college_id = audit_logs.college_id
        )
    );

-- RLS Policies for security_settings
CREATE POLICY "Users can manage their own security settings" ON public.security_settings
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all security settings" ON public.security_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.admin_role_type = 'super_admin' 
            AND ar.is_active = true
            AND ar.college_id = security_settings.college_id
        )
    );

-- Functions for role management
CREATE OR REPLACE FUNCTION public.get_user_admin_roles(user_uuid UUID, college_uuid UUID)
RETURNS TABLE (
    role_type public.admin_role_type,
    permissions JSONB,
    assigned_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ar.admin_role_type,
        ar.permissions,
        ar.assigned_at
    FROM public.admin_roles ar
    WHERE ar.user_id = user_uuid 
    AND ar.college_id = college_uuid
    AND ar.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific admin permission
CREATE OR REPLACE FUNCTION public.has_admin_permission(
    user_uuid UUID, 
    college_uuid UUID, 
    required_role public.admin_role_type
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_roles ar
        WHERE ar.user_id = user_uuid 
        AND ar.college_id = college_uuid
        AND ar.admin_role_type = required_role
        AND ar.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
    college_uuid UUID,
    admin_uuid UUID,
    target_uuid UUID,
    action_type_param TEXT,
    action_desc TEXT,
    module_param TEXT,
    old_vals JSONB DEFAULT NULL,
    new_vals JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        college_id,
        admin_user_id,
        target_user_id,
        action_type,
        action_description,
        module,
        old_values,
        new_values
    ) VALUES (
        college_uuid,
        admin_uuid,
        target_uuid,
        action_type_param,
        action_desc,
        module_param,
        old_vals,
        new_vals
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
