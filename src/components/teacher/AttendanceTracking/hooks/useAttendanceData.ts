import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Student, AttendanceRecord, ErrorState, LoadingState } from '../types';
import { demoDataService } from '../services/demoDataService';
import { createErrorState, AttendanceError } from '../utils/errorHandler';
import { useEnhancedToast } from './useEnhancedToast';
import { useLoadingState } from './useLoadingState';

interface UseAttendanceDataReturn {
  students: Student[];
  loading: boolean;
  loadingState: LoadingState;
  error: ErrorState | null;
  markAttendance: (studentId: string, status: 'present' | 'absent', courseId: string) => Promise<void>;
  fetchStudents: (courseId: string) => Promise<void>;
  insertDemoData: () => Promise<void>;
  clearError: () => void;
  retryLastOperation: () => Promise<void>;
}

export const useAttendanceData = (teacherId: string): UseAttendanceDataReturn => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [lastOperation, setLastOperation] = useState<{ type: string; params: any[] } | null>(null);
  
  const { loadingState, setLoading: setLoadingState } = useLoadingState();
  const { showError, showAttendanceUpdate, showOperationSuccess, showNetworkError } = useEnhancedToast();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retryLastOperation = useCallback(async () => {
    if (!lastOperation) return;
    
    clearError();
    
    switch (lastOperation.type) {
      case 'fetchStudents':
        await fetchStudents(lastOperation.params[0]);
        break;
      case 'markAttendance':
        await markAttendance(lastOperation.params[0], lastOperation.params[1], lastOperation.params[2]);
        break;
      case 'insertDemoData':
        await insertDemoData();
        break;
    }
  }, [lastOperation]);

  const handleError = useCallback((err: Error, context: string): ErrorState => {
    console.error(`Error in ${context}:`, err);
    
    const errorState = createErrorState(err, context, retryLastOperation);
    setError(errorState);
    showError(errorState);
    
    return errorState;
  }, [retryLastOperation, showError]);

  const fetchStudents = useCallback(async (courseId: string) => {
    if (!courseId) return;
    
    setLastOperation({ type: 'fetchStudents', params: [courseId] });
    setLoading(true);
    setLoadingState(true, 'fetching', 'Loading demo data for testing...');
    setError(null);
    
    try {
      console.log('Loading demo data for course:', courseId);
      
      // For now, just load demo data immediately
      const demoStudents = demoDataService.generateDemoStudents();
      setStudents(demoStudents);
      
      showOperationSuccess('demo_data_loaded', `${demoStudents.length} demo students loaded for course ${courseId}`);
      
    } catch (err) {
      handleError(err as Error, 'fetchStudents');
    } finally {
      setLoading(false);
      setLoadingState(false);
    }
  }, [handleError, showOperationSuccess, setLoadingState]);

  const markAttendance = useCallback(async (studentId: string, status: 'present' | 'absent', courseId: string) => {
    setLastOperation({ type: 'markAttendance', params: [studentId, status, courseId] });
    setLoading(true);
    setLoadingState(true, 'saving', 'Saving attendance...');
    setError(null);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();
      
      // Find the student
      const student = students.find(s => s.id === studentId);
      if (!student) throw new Error('Student not found');
      
      // Handle demo data differently
      if (studentId.startsWith('demo-student-')) {
        // For demo data, just update local state
        setStudents(prev => prev.map(s => 
          s.id === studentId 
            ? { ...s, attendance_status: status }
            : s
        ));

        showAttendanceUpdate(`${student.first_name} ${student.last_name}`, status, true);
        
        return;
      }
      
      // Check if attendance record already exists for today
      const { data: existingRecord, error: checkError } = await supabase
        .from('attendance')
        .select('id')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .eq('class_date', today)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw checkError;
      }

      let result;
      if (existingRecord) {
        // Update existing record
        result = await supabase
          .from('attendance')
          .update({
            status,
            marked_by: teacherId,
            marked_at: now
          })
          .eq('id', existingRecord.id);
      } else {
        // Create new record
        result = await supabase
          .from('attendance')
          .insert({
            student_id: studentId,
            course_id: courseId,
            class_date: today,
            status,
            marked_by: teacherId,
            marked_at: now
          });
      }

      if (result.error) throw result.error;

      // Update local state optimistically with real-time percentage calculation
      setStudents(prev => prev.map(student => {
        if (student.id === studentId) {
          // Calculate new percentage based on attendance history
          const currentPercentage = student.attendance_percentage;
          let newPercentage = currentPercentage;
          
          // For demo data, simulate realistic percentage calculations
          if (studentId.startsWith('demo-student-')) {
            // Simulate cumulative attendance calculation with more noticeable changes
            const estimatedTotalClasses = 10; // Smaller total for more visible percentage changes
            const estimatedPresentClasses = Math.round((currentPercentage / 100) * estimatedTotalClasses);
            
            let newPresentClasses = estimatedPresentClasses;
            let newTotalClasses = estimatedTotalClasses + 1; // Add today's class
            
            // Update present count based on new status
            if (status === 'present') {
              newPresentClasses = estimatedPresentClasses + 1;
            } else if (status === 'absent') {
              // Present count stays the same, but total increases
            }
            
            // Calculate new percentage
            newPercentage = Math.round((newPresentClasses / newTotalClasses) * 100);
            
            console.log(`Attendance calculation for ${student.first_name}: ${estimatedPresentClasses}/${estimatedTotalClasses} -> ${newPresentClasses}/${newTotalClasses} = ${newPercentage}%`);
          } else {
            // For real data, use a more conservative update
            if (status === 'present' && student.attendance_status !== 'present') {
              newPercentage = Math.min(100, currentPercentage + 2);
            } else if (status === 'absent' && student.attendance_status !== 'absent') {
              newPercentage = Math.max(0, currentPercentage - 2);
            }
          }
          
          return { 
            ...student, 
            attendance_status: status,
            attendance_percentage: newPercentage
          };
        }
        return student;
      }));

      showAttendanceUpdate(`${student.first_name} ${student.last_name}`, status, false);

    } catch (err) {
      handleError(err as Error, 'markAttendance');
    } finally {
      setLoading(false);
      setLoadingState(false);
    }
  }, [students, teacherId, handleError, showAttendanceUpdate, setLoadingState]);

  const insertDemoData = useCallback(async () => {
    setLastOperation({ type: 'insertDemoData', params: [] });
    setLoading(true);
    setLoadingState(true, 'inserting', 'Adding demo data...');
    setError(null);
    
    try {
      console.log('Generating demo students...');
      const demoStudents = demoDataService.generateDemoStudents();
      console.log('Demo students generated:', demoStudents.length);
      setStudents(demoStudents);
      
      showOperationSuccess('demo_data_inserted', `${demoStudents.length} demo students added for testing`);

    } catch (err) {
      console.error('Error in insertDemoData:', err);
      handleError(err as Error, 'insertDemoData');
    } finally {
      setLoading(false);
      setLoadingState(false);
    }
  }, [handleError, showOperationSuccess, setLoadingState]);

  return {
    students,
    loading,
    loadingState,
    error,
    markAttendance,
    fetchStudents,
    insertDemoData,
    clearError,
    retryLastOperation
  };
};