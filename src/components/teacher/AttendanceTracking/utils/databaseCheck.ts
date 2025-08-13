import { supabase } from '@/integrations/supabase/client';

export interface DatabaseStatus {
  enrollments: boolean;
  attendance: boolean;
  user_profiles: boolean;
  courses: boolean;
  allTablesExist: boolean;
}

export const checkDatabaseTables = async (): Promise<DatabaseStatus> => {
  const status: DatabaseStatus = {
    enrollments: false,
    attendance: false,
    user_profiles: false,
    courses: false,
    allTablesExist: false
  };

  try {
    // Check if enrollments table exists
    const { error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('id')
      .limit(1);
    status.enrollments = !enrollmentsError;

    // Check if attendance table exists
    const { error: attendanceError } = await supabase
      .from('attendance')
      .select('id')
      .limit(1);
    status.attendance = !attendanceError;

    // Check if user_profiles table exists
    const { error: profilesError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    status.user_profiles = !profilesError;

    // Check if courses table exists
    const { error: coursesError } = await supabase
      .from('courses')
      .select('id')
      .limit(1);
    status.courses = !coursesError;

    status.allTablesExist = status.enrollments && status.attendance && status.user_profiles && status.courses;

  } catch (error) {
    console.error('Error checking database tables:', error);
  }

  return status;
};

export const getMissingTablesMessage = (status: DatabaseStatus): string => {
  const missing = [];
  if (!status.enrollments) missing.push('enrollments');
  if (!status.attendance) missing.push('attendance');
  if (!status.user_profiles) missing.push('user_profiles');
  if (!status.courses) missing.push('courses');

  if (missing.length === 0) return '';
  
  return `Missing database tables: ${missing.join(', ')}. Please run Supabase migrations to create these tables.`;
};
