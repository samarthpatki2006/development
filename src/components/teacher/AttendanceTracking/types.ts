// Core data types for attendance tracking

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  roll_number: string;
  attendance_status: 'present' | 'absent' | 'pending';
  attendance_percentage: number;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  course_id: string;
  class_date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  marked_by: string;
  marked_at: string;
  notes?: string;
}

export interface StudentAttendanceData {
  student: {
    id: string;
    first_name: string;
    last_name: string;
    roll_number: string;
  };
  attendance_percentage: number;
  total_classes: number;
  present_count: number;
  absent_count: number;
  current_status: 'present' | 'absent' | 'pending';
}

export interface ClassAttendanceSession {
  course_id: string;
  class_date: string;
  teacher_id: string;
  students: StudentAttendanceData[];
  overall_percentage: number;
  total_students: number;
  present_count: number;
  absent_count: number;
}

export interface ErrorState {
  type: 'network' | 'browser' | 'validation' | 'unknown' | 'database' | 'permission';
  message: string;
  recoverable: boolean;
  retryAction?: () => void;
  details?: string;
  timestamp?: string;
}

export interface LoadingState {
  isLoading: boolean;
  operation?: 'fetching' | 'saving' | 'deleting' | 'inserting';
  message?: string;
}

export interface FallbackUIState {
  type: 'network_error' | 'browser_incompatible' | 'no_data' | 'permission_denied';
  title: string;
  message: string;
  actionLabel?: string;
  actionHandler?: () => void;
}