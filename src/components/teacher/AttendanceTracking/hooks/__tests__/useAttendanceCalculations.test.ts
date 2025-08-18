import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { 
  useAttendanceCalculations, 
  useRealTimeAttendanceCalculations,
  useAttendanceCalculationsCore,
  getAttendanceStatusColor, 
  getAttendanceStatusLabel, 
  getProgressBarColor 
} from '../useAttendanceCalculations';
import { Student } from '../../types';

const mockStudents: Student[] = [
  {
    id: 'student-1',
    first_name: 'John',
    last_name: 'Doe',
    roll_number: '001',
    attendance_status: 'present',
    attendance_percentage: 85
  },
  {
    id: 'student-2',
    first_name: 'Jane',
    last_name: 'Smith',
    roll_number: '002',
    attendance_status: 'absent',
    attendance_percentage: 92
  },
  {
    id: 'student-3',
    first_name: 'Bob',
    last_name: 'Johnson',
    roll_number: '003',
    attendance_status: 'pending',
    attendance_percentage: 78
  },
  {
    id: 'student-4',
    first_name: 'Alice',
    last_name: 'Brown',
    roll_number: '004',
    attendance_status: 'present',
    attendance_percentage: 95
  }
];

describe('useAttendanceCalculations', () => {
  it('should calculate basic attendance statistics correctly', () => {
    const { result } = renderHook(() => useAttendanceCalculations(mockStudents));
    
    expect(result.current.totalStudents).toBe(4);
    expect(result.current.presentCount).toBe(2);
    expect(result.current.absentCount).toBe(1);
    expect(result.current.pendingCount).toBe(1);
  });

  it('should calculate overall percentage correctly', () => {
    const { result } = renderHook(() => useAttendanceCalculations(mockStudents));
    
    // 2 present out of 3 marked students (2 present + 1 absent) = 67%
    expect(result.current.overallPercentage).toBe(67);
  });

  it('should calculate average cumulative attendance correctly', () => {
    const { result } = renderHook(() => useAttendanceCalculations(mockStudents));
    
    // (85 + 92 + 78 + 95) / 4 = 87.5 rounded to 88%
    expect(result.current.averageCumulativeAttendance).toBe(88);
  });

  it('should count students with good attendance correctly', () => {
    const { result } = renderHook(() => useAttendanceCalculations(mockStudents));
    
    // Students with 80%+ attendance: John (85%), Jane (92%), Alice (95%) = 3 students
    expect(result.current.studentsWithGoodAttendance).toBe(3);
  });

  it('should calculate attendance distribution correctly', () => {
    const { result } = renderHook(() => useAttendanceCalculations(mockStudents));
    
    expect(result.current.attendanceDistribution.excellent).toBe(2); // 92%, 95%
    expect(result.current.attendanceDistribution.good).toBe(1); // 85%
    expect(result.current.attendanceDistribution.average).toBe(1); // 78%
    expect(result.current.attendanceDistribution.poor).toBe(0);
  });

  it('should handle empty student list', () => {
    const { result } = renderHook(() => useAttendanceCalculations([]));
    
    expect(result.current.totalStudents).toBe(0);
    expect(result.current.presentCount).toBe(0);
    expect(result.current.absentCount).toBe(0);
    expect(result.current.pendingCount).toBe(0);
    expect(result.current.overallPercentage).toBe(0);
    expect(result.current.averageCumulativeAttendance).toBe(0);
    expect(result.current.studentsWithGoodAttendance).toBe(0);
  });

  it('should handle all pending students', () => {
    const pendingStudents: Student[] = [
      {
        id: 'student-1',
        first_name: 'John',
        last_name: 'Doe',
        roll_number: '001',
        attendance_status: 'pending',
        attendance_percentage: 85
      }
    ];

    const { result } = renderHook(() => useAttendanceCalculations(pendingStudents));
    
    expect(result.current.overallPercentage).toBe(0); // No marked students
    expect(result.current.pendingCount).toBe(1);
  });

  it('should recalculate when students change', () => {
    const { result, rerender } = renderHook(
      ({ students }) => useAttendanceCalculations(students),
      { initialProps: { students: mockStudents } }
    );
    
    expect(result.current.presentCount).toBe(2);
    
    // Update students with different attendance status
    const updatedStudents = mockStudents.map(student => 
      student.id === 'student-3' 
        ? { ...student, attendance_status: 'present' as const }
        : student
    );
    
    rerender({ students: updatedStudents });
    
    expect(result.current.presentCount).toBe(3);
    expect(result.current.pendingCount).toBe(0);
  });
});

describe('useRealTimeAttendanceCalculations', () => {
  it('should provide real-time calculations that update immediately', () => {
    const { result } = renderHook(() => useRealTimeAttendanceCalculations(mockStudents));
    
    expect(result.current.dailyStats.presentCount).toBe(2);
    expect(result.current.dailyStats.absentCount).toBe(1);
    expect(result.current.dailyStats.pendingCount).toBe(1);
    expect(result.current.classStats.overallPercentage).toBe(67);
  });

  it('should update calculations when student attendance changes', () => {
    const { result } = renderHook(() => useRealTimeAttendanceCalculations(mockStudents));
    
    // Update a pending student to present
    const updatedCalculations = result.current.updateStudentAttendance('student-3', 'present');
    
    expect(updatedCalculations.dailyStats.presentCount).toBe(3);
    expect(updatedCalculations.dailyStats.pendingCount).toBe(0);
    expect(updatedCalculations.classStats.overallPercentage).toBe(75); // 3 out of 4 marked students
  });

  it('should provide enhanced student data with detailed calculations', () => {
    const { result } = renderHook(() => useRealTimeAttendanceCalculations(mockStudents));
    
    expect(result.current.enhancedStudents).toHaveLength(4);
    expect(result.current.enhancedStudents[0]).toHaveProperty('student');
    expect(result.current.enhancedStudents[0]).toHaveProperty('attendance_percentage');
    expect(result.current.enhancedStudents[0]).toHaveProperty('total_classes');
    expect(result.current.enhancedStudents[0]).toHaveProperty('present_count');
    expect(result.current.enhancedStudents[0]).toHaveProperty('absent_count');
  });

  it('should handle empty student list in real-time calculations', () => {
    const { result } = renderHook(() => useRealTimeAttendanceCalculations([]));
    
    expect(result.current.dailyStats.totalStudents).toBe(0);
    expect(result.current.classStats.overallPercentage).toBe(0);
    expect(result.current.enhancedStudents).toHaveLength(0);
  });
});

describe('useAttendanceCalculationsCore', () => {
  it('should provide core calculation functions', () => {
    const { result } = renderHook(() => useAttendanceCalculationsCore());
    
    expect(typeof result.current.calculateStudentPercentage).toBe('function');
    expect(typeof result.current.calculateDailyAttendance).toBe('function');
    expect(typeof result.current.calculateClassStatistics).toBe('function');
    expect(typeof result.current.getEnhancedStudentData).toBe('function');
    expect(typeof result.current.getClassSession).toBe('function');
  });

  it('should calculate student percentage correctly', () => {
    const { result } = renderHook(() => useAttendanceCalculationsCore());
    
    expect(result.current.calculateStudentPercentage(8, 10)).toBe(80);
    expect(result.current.calculateStudentPercentage(0, 10)).toBe(0);
    expect(result.current.calculateStudentPercentage(10, 0)).toBe(0);
  });

  it('should calculate daily attendance correctly', () => {
    const { result } = renderHook(() => useAttendanceCalculationsCore());
    
    const dailyStats = result.current.calculateDailyAttendance(mockStudents);
    
    expect(dailyStats.totalStudents).toBe(4);
    expect(dailyStats.presentCount).toBe(2);
    expect(dailyStats.absentCount).toBe(1);
    expect(dailyStats.pendingCount).toBe(1);
    expect(dailyStats.percentage).toBe(67); // 2 present out of 3 marked
  });
});

describe('getAttendanceStatusColor', () => {
  it('should return correct colors for different percentages', () => {
    expect(getAttendanceStatusColor(95)).toBe('text-green-700');
    expect(getAttendanceStatusColor(85)).toBe('text-green-600');
    expect(getAttendanceStatusColor(70)).toBe('text-yellow-600');
    expect(getAttendanceStatusColor(50)).toBe('text-red-600');
  });
});

describe('getAttendanceStatusLabel', () => {
  it('should return correct labels for different percentages', () => {
    expect(getAttendanceStatusLabel(95)).toBe('Excellent');
    expect(getAttendanceStatusLabel(85)).toBe('Good');
    expect(getAttendanceStatusLabel(70)).toBe('Average');
    expect(getAttendanceStatusLabel(50)).toBe('Poor');
  });
});

describe('getProgressBarColor', () => {
  it('should return correct colors for different percentages', () => {
    expect(getProgressBarColor(95)).toBe('bg-green-600');
    expect(getProgressBarColor(85)).toBe('bg-green-500');
    expect(getProgressBarColor(70)).toBe('bg-yellow-500');
    expect(getProgressBarColor(50)).toBe('bg-red-500');
  });
});