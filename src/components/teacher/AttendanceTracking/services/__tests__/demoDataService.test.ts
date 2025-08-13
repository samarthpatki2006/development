import { describe, it, expect } from 'vitest';
import { demoDataService } from '../demoDataService';

describe('demoDataService', () => {
  describe('generateDemoStudents', () => {
    it('should generate 10 demo students', () => {
      const students = demoDataService.generateDemoStudents();
      
      expect(students).toHaveLength(10);
    });

    it('should generate students with correct structure', () => {
      const students = demoDataService.generateDemoStudents();
      
      students.forEach((student, index) => {
        expect(student).toHaveProperty('id', `demo-student-${index + 1}`);
        expect(student).toHaveProperty('first_name');
        expect(student).toHaveProperty('last_name');
        expect(student).toHaveProperty('roll_number');
        expect(student).toHaveProperty('attendance_status', 'pending');
        expect(student).toHaveProperty('attendance_percentage');
        expect(typeof student.attendance_percentage).toBe('number');
        expect(student.attendance_percentage).toBeGreaterThanOrEqual(0);
        expect(student.attendance_percentage).toBeLessThanOrEqual(100);
      });
    });

    it('should generate students with expected names', () => {
      const students = demoDataService.generateDemoStudents();
      
      expect(students[0].first_name).toBe('Alice');
      expect(students[0].last_name).toBe('Johnson');
      expect(students[0].roll_number).toBe('CS001');
      
      expect(students[1].first_name).toBe('Bob');
      expect(students[1].last_name).toBe('Smith');
      expect(students[1].roll_number).toBe('CS002');
    });

    it('should generate unique IDs for each student', () => {
      const students = demoDataService.generateDemoStudents();
      const ids = students.map(s => s.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(students.length);
    });
  });

  describe('generateDemoAttendanceHistory', () => {
    it('should generate attendance percentage within valid range', () => {
      const percentage1 = demoDataService.generateDemoAttendanceHistory('demo-student-1', 20);
      const percentage2 = demoDataService.generateDemoAttendanceHistory('demo-student-5', 30);
      
      expect(percentage1).toBeGreaterThanOrEqual(60);
      expect(percentage1).toBeLessThanOrEqual(100);
      expect(percentage2).toBeGreaterThanOrEqual(60);
      expect(percentage2).toBeLessThanOrEqual(100);
    });

    it('should generate consistent percentages for the same student', () => {
      const studentId = 'demo-student-3';
      const percentage1 = demoDataService.generateDemoAttendanceHistory(studentId, 20);
      const percentage2 = demoDataService.generateDemoAttendanceHistory(studentId, 20);
      
      expect(percentage1).toBe(percentage2);
    });

    it('should generate different percentages for different students', () => {
      const percentages = [];
      for (let i = 1; i <= 5; i++) {
        percentages.push(demoDataService.generateDemoAttendanceHistory(`demo-student-${i}`, 20));
      }
      
      // Check that we have at least some variation in the percentages
      const uniquePercentages = new Set(percentages);
      expect(uniquePercentages.size).toBeGreaterThan(1);
    });

    it('should handle edge cases gracefully', () => {
      const percentage1 = demoDataService.generateDemoAttendanceHistory('invalid-id', 10);
      const percentage2 = demoDataService.generateDemoAttendanceHistory('demo-student-999', 0);
      
      expect(percentage1).toBeGreaterThanOrEqual(60);
      expect(percentage1).toBeLessThanOrEqual(100);
      expect(percentage2).toBeGreaterThanOrEqual(60);
      expect(percentage2).toBeLessThanOrEqual(100);
    });
  });
});