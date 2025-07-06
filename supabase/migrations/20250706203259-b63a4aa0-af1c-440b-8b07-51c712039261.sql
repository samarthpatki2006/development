
-- First, let's add some sample user profiles for testing
-- We need to insert directly into user_profiles since we don't have actual auth users yet

-- Insert sample user profiles for each college
INSERT INTO public.user_profiles (
    id, 
    college_id, 
    user_code, 
    user_type, 
    first_name, 
    last_name, 
    email, 
    is_active
) VALUES 
-- TAPMI Users
(gen_random_uuid(), 
 (SELECT id FROM public.colleges WHERE code = 'TAPMI'), 
 'STU0001', 
 'student', 
 'John', 
 'Doe', 
 'stu0001@tapmi.edu', 
 true),
(gen_random_uuid(), 
 (SELECT id FROM public.colleges WHERE code = 'TAPMI'), 
 'FAC0001', 
 'faculty', 
 'Jane', 
 'Smith', 
 'fac0001@tapmi.edu', 
 true),
(gen_random_uuid(), 
 (SELECT id FROM public.colleges WHERE code = 'TAPMI'), 
 'ADM0001', 
 'admin', 
 'Admin', 
 'User', 
 'adm0001@tapmi.edu', 
 true),

-- BITS Users  
(gen_random_uuid(), 
 (SELECT id FROM public.colleges WHERE code = 'BITS'), 
 'STU0001', 
 'student', 
 'Raj', 
 'Patel', 
 'stu0001@bits.edu', 
 true),
(gen_random_uuid(), 
 (SELECT id FROM public.colleges WHERE code = 'BITS'), 
 'FAC0001', 
 'faculty', 
 'Priya', 
 'Sharma', 
 'fac0001@bits.edu', 
 true),

-- IIMB Users
(gen_random_uuid(), 
 (SELECT id FROM public.colleges WHERE code = 'IIMB'), 
 'STU0001', 
 'student', 
 'Amit', 
 'Kumar', 
 'stu0001@iimb.edu', 
 true),
(gen_random_uuid(), 
 (SELECT id FROM public.colleges WHERE code = 'IIMB'), 
 'FAC0001', 
 'faculty', 
 'Sanya', 
 'Gupta', 
 'fac0001@iimb.edu', 
 true);

-- Create corresponding auth users for testing
-- Note: In a real application, users would sign up through the normal flow
-- For testing purposes, we'll create some sample auth entries

-- Insert test auth users (you'll need to set passwords via Supabase dashboard)
INSERT INTO auth.users (
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
) VALUES 
-- TAPMI users
((SELECT id FROM public.user_profiles WHERE user_code = 'STU0001' AND college_id = (SELECT id FROM public.colleges WHERE code = 'TAPMI')),
 'stu0001@tapmi.edu',
 now(),
 now(),
 now(),
 '{"first_name": "John", "last_name": "Doe", "user_type": "student", "user_code": "STU0001"}'::jsonb),

((SELECT id FROM public.user_profiles WHERE user_code = 'FAC0001' AND college_id = (SELECT id FROM public.colleges WHERE code = 'TAPMI')),
 'fac0001@tapmi.edu',
 now(),
 now(),
 now(),
 '{"first_name": "Jane", "last_name": "Smith", "user_type": "faculty", "user_code": "FAC0001"}'::jsonb);
