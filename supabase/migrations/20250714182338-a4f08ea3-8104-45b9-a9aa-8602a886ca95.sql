-- Update all faculty references to teacher
UPDATE public.user_profiles SET user_type = 'teacher' WHERE user_type = 'faculty';

-- Update role_permissions table references
UPDATE public.role_permissions SET role_group = 'teacher' WHERE role_group = 'faculty';

-- Update role_hierarchy table references  
UPDATE public.role_hierarchy SET role_group = 'teacher' WHERE role_group = 'faculty';

-- Update user_roles table references
UPDATE public.user_roles SET role_group = 'teacher' WHERE role_group = 'faculty';

-- Create teacher role type enum
CREATE TYPE public.teacher_role_type AS ENUM (
    'hod',
    'senior_teacher',
    'assistant_teacher', 
    'teaching_assistant'
);

-- Update role hierarchy for teacher roles
UPDATE public.role_hierarchy SET 
    role_type = 'senior_teacher',
    display_name = 'Senior Teacher'
WHERE role_group = 'teacher' AND role_type = 'senior_faculty';

UPDATE public.role_hierarchy SET 
    role_type = 'assistant_teacher', 
    display_name = 'Assistant Teacher'
WHERE role_group = 'teacher' AND role_type = 'assistant_faculty';

-- Update user_roles table for teacher role types
UPDATE public.user_roles SET role_type = 'senior_teacher' WHERE role_group = 'teacher' AND role_type = 'senior_faculty';
UPDATE public.user_roles SET role_type = 'assistant_teacher' WHERE role_group = 'teacher' AND role_type = 'assistant_faculty';

-- Update role_permissions table for teacher role types  
UPDATE public.role_permissions SET role_type = 'senior_teacher' WHERE role_group = 'teacher' AND role_type = 'senior_faculty';
UPDATE public.role_permissions SET role_type = 'assistant_teacher' WHERE role_group = 'teacher' AND role_type = 'assistant_faculty';