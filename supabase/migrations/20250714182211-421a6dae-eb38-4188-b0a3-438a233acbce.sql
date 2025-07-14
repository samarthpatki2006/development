-- Update enum types to change 'faculty' to 'teacher'
ALTER TYPE public.user_type_enum RENAME TO user_type_enum_old;

CREATE TYPE public.user_type_enum AS ENUM (
    'student',
    'teacher',
    'admin', 
    'staff',
    'parent',
    'alumni',
    'super_admin'
);

-- Update all existing data
UPDATE public.user_profiles SET user_type = 'teacher'::public.user_type_enum WHERE user_type::text = 'faculty';

-- Update the table to use new enum
ALTER TABLE public.user_profiles 
    ALTER COLUMN user_type TYPE public.user_type_enum USING user_type::text::public.user_type_enum;

-- Update other enum types that reference faculty
ALTER TYPE public.user_hierarchy_level RENAME TO user_hierarchy_level_old;

CREATE TYPE public.user_hierarchy_level AS ENUM (
    'super_admin',
    'admin', 
    'teacher',
    'student',
    'parent',
    'alumni'
);

-- Update role_permissions table references
UPDATE public.role_permissions SET role_group = 'teacher' WHERE role_group = 'faculty';

-- Update role_hierarchy table references  
UPDATE public.role_hierarchy SET role_group = 'teacher' WHERE role_group = 'faculty';

-- Update user_roles table references
UPDATE public.user_roles SET role_group = 'teacher' WHERE role_group = 'faculty';

-- Drop old enum types
DROP TYPE public.user_type_enum_old;
DROP TYPE public.user_hierarchy_level_old;