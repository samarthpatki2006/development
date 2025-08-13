import { Student } from '../types';

export interface DemoDataService {
  generateDemoStudents: () => Student[];
  generateDemoAttendanceHistory: (studentId: string, totalClasses: number) => number;
}

export const demoDataService: DemoDataService = {
  generateDemoStudents: (): Student[] => {
    const demoStudents = [
      {
        first_name: 'Alice',
        last_name: 'Johnson',
        roll_number: 'CS001',
        attendance_percentage: 75 // Lower percentage for more noticeable changes
      },
      {
        first_name: 'Bob',
        last_name: 'Smith',
        roll_number: 'CS002',
        attendance_percentage: 80
      },
      {
        first_name: 'Carol',
        last_name: 'Davis',
        roll_number: 'CS003',
        attendance_percentage: 65
      },
      {
        first_name: 'David',
        last_name: 'Wilson',
        roll_number: 'CS004',
        attendance_percentage: 70
      },
      {
        first_name: 'Emma',
        last_name: 'Brown',
        roll_number: 'CS005',
        attendance_percentage: 85
      },
      {
        first_name: 'Frank',
        last_name: 'Miller',
        roll_number: 'CS006',
        attendance_percentage: 60
      },
      {
        first_name: 'Grace',
        last_name: 'Taylor',
        roll_number: 'CS007',
        attendance_percentage: 75
      },
      {
        first_name: 'Henry',
        last_name: 'Anderson',
        roll_number: 'CS008',
        attendance_percentage: 68
      },
      {
        first_name: 'Isabella',
        last_name: 'Martinez',
        roll_number: 'CS009',
        attendance_percentage: 82
      },
      {
        first_name: 'Jack',
        last_name: 'Thompson',
        roll_number: 'CS010',
        attendance_percentage: 77
      }
    ];

    return demoStudents.map((student, index) => ({
      ...student,
      id: `demo-student-${index + 1}`,
      attendance_status: 'pending' as const
    }));
  },

  generateDemoAttendanceHistory: (studentId: string, totalClasses: number): number => {
    // Generate a realistic attendance percentage based on student ID
    const studentIndex = parseInt(studentId.split('-')[2]) || 1;
    const basePercentage = 70 + (studentIndex * 3) % 25; // Range from 70-95%
    
    // Add some randomness but keep it consistent for the same student
    const seed = studentIndex * 7;
    const variation = (seed % 10) - 5; // -5 to +5 variation
    
    return Math.max(60, Math.min(100, basePercentage + variation));
  }
};

export default demoDataService;