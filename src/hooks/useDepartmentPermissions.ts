import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DepartmentPermissions {
  canCreateEvents: boolean;
  canEditEvents: boolean;
  canDeleteEvents: boolean;
  canPinMessages: boolean;
  canUnpinMessages: boolean;
  canManageMembers: boolean;
  canModerateDiscussions: boolean;
  canSendMessages: boolean;
  canViewEvents: boolean;
  canUploadFiles: boolean;
  canViewMembers: boolean;
  role: 'hod' | 'admin' | 'member' | null;
  isHOD: boolean;
  isAdmin: boolean;
  isMember: boolean;
}

export function useDepartmentPermissions(
  departmentId: string | undefined,
  userId: string | undefined
): DepartmentPermissions {
  const [permissions, setPermissions] = useState<DepartmentPermissions>({
    canCreateEvents: false,
    canEditEvents: false,
    canDeleteEvents: false,
    canPinMessages: false,
    canUnpinMessages: false,
    canManageMembers: false,
    canModerateDiscussions: false,
    canSendMessages: false,
    canViewEvents: false,
    canUploadFiles: false,
    canViewMembers: false,
    role: null,
    isHOD: false,
    isAdmin: false,
    isMember: false,
  });

  useEffect(() => {
    async function fetchPermissions() {
      if (!departmentId || !userId) {
        // Reset permissions if no department or user
        setPermissions({
          canCreateEvents: false,
          canEditEvents: false,
          canDeleteEvents: false,
          canPinMessages: false,
          canUnpinMessages: false,
          canManageMembers: false,
          canModerateDiscussions: false,
          canSendMessages: false,
          canViewEvents: false,
          canUploadFiles: false,
          canViewMembers: false,
          role: null,
          isHOD: false,
          isAdmin: false,
          isMember: false,
        });
        return;
      }

      try {
        console.log('Fetching permissions for:', { departmentId, userId });
        
        // Fetch user's role in the department
        const { data: memberData, error } = await supabase
          .from('department_members')
          .select('role')
          .eq('department_id', departmentId)
          .eq('faculty_id', userId)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('Error fetching member role:', error);
          // User is not a member of this department - reset permissions
          setPermissions({
            canCreateEvents: false,
            canEditEvents: false,
            canDeleteEvents: false,
            canPinMessages: false,
            canUnpinMessages: false,
            canManageMembers: false,
            canModerateDiscussions: false,
            canSendMessages: false,
            canViewEvents: false,
            canUploadFiles: false,
            canViewMembers: false,
            role: null,
            isHOD: false,
            isAdmin: false,
            isMember: false,
          });
          return;
        }

        if (!memberData) {
          console.warn('No member data found for user in this department');
          setPermissions({
            canCreateEvents: false,
            canEditEvents: false,
            canDeleteEvents: false,
            canPinMessages: false,
            canUnpinMessages: false,
            canManageMembers: false,
            canModerateDiscussions: false,
            canSendMessages: false,
            canViewEvents: false,
            canUploadFiles: false,
            canViewMembers: false,
            role: null,
            isHOD: false,
            isAdmin: false,
            isMember: false,
          });
          return;
        }

        const role = memberData.role as 'hod' | 'admin' | 'member';
        const isHOD = role === 'hod';
        const isAdmin = role === 'admin';
        const isMember = role === 'member';

        // Define permissions based on role
        setPermissions({
          // HOD has all permissions
          canCreateEvents: isHOD || isAdmin,
          canEditEvents: isHOD || isAdmin,
          canDeleteEvents: isHOD || isAdmin,
          canPinMessages: isHOD || isAdmin,
          canUnpinMessages: isHOD || isAdmin,
          canManageMembers: isHOD || isAdmin,
          canModerateDiscussions: isHOD || isAdmin,
          
          // All members can do these
          canSendMessages: true,
          canViewEvents: true,
          canUploadFiles: true,
          canViewMembers: true,
          
          // Role information
          role,
          isHOD,
          isAdmin,
          isMember,
        });

        console.log('Department permissions loaded:', { role, departmentId, userId });
      } catch (error) {
        console.error('Error in useDepartmentPermissions:', error);
        // Reset on error
        setPermissions({
          canCreateEvents: false,
          canEditEvents: false,
          canDeleteEvents: false,
          canPinMessages: false,
          canUnpinMessages: false,
          canManageMembers: false,
          canModerateDiscussions: false,
          canSendMessages: false,
          canViewEvents: false,
          canUploadFiles: false,
          canViewMembers: false,
          role: null,
          isHOD: false,
          isAdmin: false,
          isMember: false,
        });
      }
    }

    fetchPermissions();
  }, [departmentId, userId]);

  return permissions;
}
