-- Update only the user_profiles table since that's what we need
-- The user_profiles already has been updated to use 'teacher' instead of 'faculty'
-- Let's just verify the change worked
SELECT user_type, COUNT(*) FROM public.user_profiles GROUP BY user_type;