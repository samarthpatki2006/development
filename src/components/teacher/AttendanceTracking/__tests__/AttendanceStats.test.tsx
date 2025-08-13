import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AttendanceStats from '../AttendanceStats';
import { Student } from '../types';

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

describe('AttendanceStats', () => {
  it('should render total students count', () => {
    render(<AttendanceStats students={mockStudents} />);
    
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Total Students')).toBeInTheDocument();
  });

  it('should render present count correctly', () => {
    render(<AttendanceStats students={mockStudents} />);
    
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getAllByText('Present Today')).toHaveLength(2); // Appears in card title and overview
  });

  it('should render absent count correctly', () => {
    render(<AttendanceStats students={mockStudents} />);
    
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Absent Today')).toBeInTheDocument();
  });

  it('should calculate today\'s attendance rate correctly', () => {
    render(<AttendanceStats students={mockStudents} />);
    
    // 2 present out of 3 marked students (2 present + 1 absent) = 67%
    expect(screen.getByText('67%')).toBeInTheDocument();
    expect(screen.getByText('Today\'s Rate')).toBeInTheDocument();
  });

  it('should calculate average cumulative attendance correctly', () => {
    render(<AttendanceStats students={mockStudents} />);
    
    // (85 + 92 + 78 + 95) / 4 = 87.5 rounded to 88%
    expect(screen.getByText('88%')).toBeInTheDocument();
    expect(screen.getByText('Average Cumulative Attendance')).toBeInTheDocument();
  });

  it('should show students with good attendance count', () => {
    render(<AttendanceStats students={mockStudents} />);
    
    // Students with 80%+ attendance: John (85%), Jane (92%), Alice (95%) = 3 students
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Students with 80%+ Attendance')).toBeInTheDocument();
  });

  it('should handle empty student list', () => {
    render(<AttendanceStats students={[]} />);
    
    // Component should not render anything for empty list
    expect(screen.queryByText('Total Students')).not.toBeInTheDocument();
  });

  it('should show pending count in present today section', () => {
    render(<AttendanceStats students={mockStudents} />);
    
    expect(screen.getByText('1 pending')).toBeInTheDocument();
  });

  it('should display class performance overview', () => {
    render(<AttendanceStats students={mockStudents} />);
    
    expect(screen.getByText('Class Performance Overview')).toBeInTheDocument();
    expect(screen.getByText('2/4')).toBeInTheDocument();
    expect(screen.getAllByText('Present Today')).toHaveLength(2); // Appears in card title and overview
  });

  it('should show attendance distribution legend', () => {
    render(<AttendanceStats students={mockStudents} />);
    
    expect(screen.getByText('Present')).toBeInTheDocument();
    expect(screen.getByText('Absent')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});