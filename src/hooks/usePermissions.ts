
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserPermissions {
  // Dashboard & Profile
  view_personal_dashboard: boolean;
  view_college_branding: boolean;
  
  // Academic
  view_submit_assignments: boolean;
  review_assignments: boolean;
  view_grades: boolean;
  assign_grades: boolean;
  view_child_grades: boolean;
  mark_attendance: boolean;
  view_attendance: boolean;
  view_child_attendance: boolean;
  upload_materials: boolean;
  
  // Communication
  join_forums: boolean;
  
  // Financial
  view_fees: boolean;
  review_fees: boolean;
  view_child_fees: boolean;
  make_payments: boolean;
  make_child_payments: boolean;
  
  // Services
  request_certificates: boolean;
  apply_hostel: boolean;
  facility_requests: boolean;
  support_tickets: boolean;
  
  // Alumni specific
  alumni_contributions: boolean;
  alumni_events: boolean;
}

const defaultPermissions: UserPermissions = {
  view_personal_dashboard: false,
  view_college_branding: false,
  view_submit_assignments: false,
  review_assignments: false,
  view_grades: false,
  assign_grades: false,
  view_child_grades: false,
  mark_attendance: false,
  view_attendance: false,
  view_child_attendance: false,
  upload_materials: false,
  join_forums: false,
  view_fees: false,
  review_fees: false,
  view_child_fees: false,
  make_payments: false,
  make_child_payments: false,
  request_certificates: false,
  apply_hostel: false,
  facility_requests: false,
  support_tickets: false,
  alumni_contributions: false,
  alumni_events: false,
};

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissions);
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserPermissions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Get user profile to determine user type
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();

        if (!profile) {
          setLoading(false);
          return;
        }

        setUserType(profile.user_type);

        // Set permissions based on user type according to the matrix
        const userPermissions: UserPermissions = { ...defaultPermissions };

        // Common permissions for all users
        userPermissions.view_personal_dashboard = true;
        userPermissions.view_college_branding = true;
        userPermissions.support_tickets = true;

        switch (profile.user_type) {
          case 'student':
            userPermissions.view_submit_assignments = true;
            userPermissions.view_grades = true;
            userPermissions.view_attendance = true;
            userPermissions.join_forums = true;
            userPermissions.view_fees = true;
            userPermissions.make_payments = true;
            userPermissions.request_certificates = true;
            userPermissions.apply_hostel = true;
            userPermissions.facility_requests = true;
            break;

          case 'teacher':
            userPermissions.view_submit_assignments = true;
            userPermissions.review_assignments = true;
            userPermissions.view_grades = true;
            userPermissions.assign_grades = true;
            userPermissions.mark_attendance = true;
            userPermissions.view_attendance = true;
            userPermissions.upload_materials = true;
            userPermissions.join_forums = true;
            userPermissions.view_fees = true;
            userPermissions.review_fees = true;
            userPermissions.request_certificates = true;
            userPermissions.facility_requests = true;
            break;

          case 'parent':
            userPermissions.view_child_grades = true;
            userPermissions.view_child_attendance = true;
            userPermissions.view_child_fees = true;
            userPermissions.make_child_payments = true;
            break;

          case 'alumni':
            userPermissions.join_forums = true;
            userPermissions.request_certificates = true;
            userPermissions.alumni_contributions = true;
            userPermissions.alumni_events = true;
            break;
        }

        setPermissions(userPermissions);
      } catch (error) {
        console.error('Error loading user permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserPermissions();
  }, []);

  return { permissions, userType, loading };
};
