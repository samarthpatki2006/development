import { useMemo, useCallback } from 'react';
import { Student, StudentAttendanceData, ClassAttendanceSession } from '../types';

interface AttendanceCalculations {
  // Individual student calculations
  calculateStudentPercentage: (presentCount: number, totalClasses: number) => number;
  calculateDailyAttendance: (students: Student[]) => {
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    pendingCount: number;
    percentage: number;
  };
  
  // Class-wide calculations
  calculateClassStatistics: (students: Student[]) => {
    overallPercentage: number;
    totalStudents: number;
    presentToday: number;
    absentToday: number;
    pendingToday: number;
    averageCumulativePercentage: number;
  };
  
  // Enhanced student data with calculations
  getEnhancedStudentData: (students: Student[]) => StudentAttendanceData[];
  
  // Session summary
  getClassSession: (
    students: Student[], 
    courseId: string, 
    teacherId: string
  ) => ClassAttendanceSession;
}

// Interface for the hook that AttendanceStats expects
interface AttendanceStatsCalculations {
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  pendingCount: number;
  overallPercentage: number;
  averageCumulativeAttendance: number;
  studentsWithGoodAttendance: number;
  attendanceDistribution: {
    excellent: number; // 90%+
    good: number;      // 80-89%
    average: number;   // 70-79%
    poor: number;      // <70%
  };
}

// Utility functions for styling
export const getAttendanceStatusColor = (percentage: number): string => {
  if (percentage >= 90) return 'text-green-700';
  if (percentage >= 80) return 'text-green-600';
  if (percentage >= 70) return 'text-yellow-600';
  return 'text-red-600';
};

export const getAttendanceStatusLabel = (percentage: number): string => {
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 80) return 'Good';
  if (percentage >= 70) return 'Average';
  return 'Poor';
};

export const getProgressBarColor = (percentage: number): string => {
  if (percentage >= 90) return 'bg-green-600';
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 70) return 'bg-yellow-500';
  return 'bg-red-500';
};

export const useAttendanceCalculationsCore = (): AttendanceCalculations => {
  
  // Calculate individual student attendance percentage
  const calculateStudentPercentage = useCallback((presentCount: number, totalClasses: number): number => {
    if (totalClasses === 0) return 0;
    return Math.round((presentCount / totalClasses) * 100);
  }, []);

  // Calculate daily attendance statistics
  const calculateDailyAttendance = useCallback((students: Student[]) => {
    const totalStudents = students.length;
    const presentCount = students.filter(s => s.attendance_status === 'present').length;
    const absentCount = students.filter(s => s.attendance_status === 'absent').length;
    const pendingCount = students.filter(s => s.attendance_status === 'pending').length;
    
    // Calculate percentage based on marked students only (present + absent)
    const markedStudents = presentCount + absentCount;
    const percentage = markedStudents > 0 
      ? Math.round((presentCount / markedStudents) * 100)
      : 0;

    return {
      totalStudents,
      presentCount,
      absentCount,
      pendingCount,
      percentage
    };
  }, []);

  // Calculate comprehensive class statistics
  const calculateClassStatistics = useCallback((students: Student[]) => {
    const dailyStats = calculateDailyAttendance(students);
    
    // Calculate average cumulative percentage across all students
    const totalCumulativePercentage = students.reduce((sum, student) => {
      return sum + student.attendance_percentage;
    }, 0);
    
    const averageCumulativePercentage = students.length > 0 
      ? Math.round(totalCumulativePercentage / students.length)
      : 0;

    return {
      overallPercentage: dailyStats.percentage,
      totalStudents: dailyStats.totalStudents,
      presentToday: dailyStats.presentCount,
      absentToday: dailyStats.absentCount,
      pendingToday: dailyStats.pendingCount,
      averageCumulativePercentage
    };
  }, [calculateDailyAttendance]);

  // Transform students into enhanced data with additional calculations
  const getEnhancedStudentData = useCallback((students: Student[]): StudentAttendanceData[] => {
    return students.map(student => {
      // For demo purposes, we'll estimate total classes and present count
      // In a real implementation, this would come from the database
      const estimatedTotalClasses = student.attendance_percentage > 0 ? 20 : 1;
      const estimatedPresentCount = Math.round((student.attendance_percentage / 100) * estimatedTotalClasses);
      const estimatedAbsentCount = estimatedTotalClasses - estimatedPresentCount;

      return {
        student: {
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          roll_number: student.roll_number
        },
        attendance_percentage: student.attendance_percentage,
        total_classes: estimatedTotalClasses,
        present_count: estimatedPresentCount,
        absent_count: estimatedAbsentCount,
        current_status: student.attendance_status
      };
    });
  }, []);

  // Generate complete class session data
  const getClassSession = useCallback((
    students: Student[], 
    courseId: string, 
    teacherId: string
  ): ClassAttendanceSession => {
    const classStats = calculateClassStatistics(students);
    const today = new Date().toISOString().split('T')[0];

    return {
      course_id: courseId,
      class_date: today,
      teacher_id: teacherId,
      students: getEnhancedStudentData(students),
      overall_percentage: classStats.overallPercentage,
      total_students: classStats.totalStudents,
      present_count: classStats.presentToday,
      absent_count: classStats.absentToday
    };
  }, [calculateClassStatistics, getEnhancedStudentData]);

  return {
    calculateStudentPercentage,
    calculateDailyAttendance,
    calculateClassStatistics,
    getEnhancedStudentData,
    getClassSession
  };
};

// Hook that provides calculations for AttendanceStats component
export const useAttendanceCalculations = (students: Student[]): AttendanceStatsCalculations => {
  return useMemo(() => {
    const totalStudents = students.length;
    const presentCount = students.filter(s => s.attendance_status === 'present').length;
    const absentCount = students.filter(s => s.attendance_status === 'absent').length;
    const pendingCount = students.filter(s => s.attendance_status === 'pending').length;
    
    // Calculate today's attendance percentage (only count marked students)
    const markedStudents = presentCount + absentCount;
    const overallPercentage = markedStudents > 0 
      ? Math.round((presentCount / markedStudents) * 100)
      : 0;

    // Calculate average cumulative attendance
    const totalCumulativePercentage = students.reduce((sum, student) => {
      return sum + student.attendance_percentage;
    }, 0);
    const averageCumulativeAttendance = totalStudents > 0 
      ? Math.round(totalCumulativePercentage / totalStudents)
      : 0;

    // Count students with good attendance (80%+)
    const studentsWithGoodAttendance = students.filter(s => s.attendance_percentage >= 80).length;

    // Calculate attendance distribution
    const attendanceDistribution = {
      excellent: students.filter(s => s.attendance_percentage >= 90).length,
      good: students.filter(s => s.attendance_percentage >= 80 && s.attendance_percentage < 90).length,
      average: students.filter(s => s.attendance_percentage >= 70 && s.attendance_percentage < 80).length,
      poor: students.filter(s => s.attendance_percentage < 70).length
    };

    return {
      totalStudents,
      presentCount,
      absentCount,
      pendingCount,
      overallPercentage,
      averageCumulativeAttendance,
      studentsWithGoodAttendance,
      attendanceDistribution
    };
  }, [students]);
};

// Hook for real-time attendance calculations with automatic updates
export const useRealTimeAttendanceCalculations = (students: Student[]) => {
  const baseCalculations = useAttendanceCalculationsCore();
  
  // Daily attendance statistics (recalculated when students change)
  const dailyStats = useMemo(() => {
    return baseCalculations.calculateDailyAttendance(students);
  }, [students, baseCalculations]);

  // Class-wide statistics (recalculated when students change)
  const classStats = useMemo(() => {
    return baseCalculations.calculateClassStatistics(students);
  }, [students, baseCalculations]);

  // Enhanced student data (recalculated when students change)
  const enhancedStudents = useMemo(() => {
    return baseCalculations.getEnhancedStudentData(students);
  }, [students, baseCalculations]);

  // Function to update a student's attendance and get new calculations
  const updateStudentAttendance = useCallback((
    studentId: string, 
    newStatus: 'present' | 'absent' | 'pending'
  ) => {
    const updatedStudents = students.map(student => 
      student.id === studentId 
        ? { ...student, attendance_status: newStatus }
        : student
    );

    // Return updated calculations immediately
    return {
      students: updatedStudents,
      dailyStats: baseCalculations.calculateDailyAttendance(updatedStudents),
      classStats: baseCalculations.calculateClassStatistics(updatedStudents)
    };
  }, [students, baseCalculations]);

  return {
    dailyStats,
    classStats,
    enhancedStudents,
    updateStudentAttendance,
    calculations: baseCalculations
  };
};