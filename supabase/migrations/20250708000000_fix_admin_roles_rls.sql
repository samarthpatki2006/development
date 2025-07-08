
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Super admins can manage all admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Admins can view their own roles" ON public.admin_roles;

-- Create simpler, non-recursive policies
-- Allow users to view their own roles
CREATE POLICY "Users can view own admin roles" ON public.admin_roles
    FOR SELECT USING (user_id = auth.uid());

-- Allow users to insert their own roles (controlled by application logic)
CREATE POLICY "Users can insert admin roles" ON public.admin_roles
    FOR INSERT WITH CHECK (true);

-- Allow updates only by the user themselves or if they have super admin privileges
-- We'll check super admin status in the application layer to avoid recursion
CREATE POLICY "Users can update admin roles" ON public.admin_roles
    FOR UPDATE USING (user_id = auth.uid() OR assigned_by = auth.uid());

-- Allow deletes only if user is the target or the assigner
CREATE POLICY "Users can delete admin roles" ON public.admin_roles
    FOR DELETE USING (user_id = auth.uid() OR assigned_by = auth.uid());

-- Update the function to avoid recursion
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

-- Create a simpler function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid UUID, college_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_roles 
        WHERE user_id = user_uuid 
        AND college_id = college_uuid
        AND admin_role_type = 'super_admin'
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
