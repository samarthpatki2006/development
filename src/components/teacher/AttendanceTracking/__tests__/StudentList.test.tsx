import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StudentList from '../StudentList';
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
  }
];

const mockOnAttendanceToggle = vi.fn();

describe('StudentList', () => {
  beforeEach(() => {
    mockOnAttendanceToggle.mockClear();
  });

  it('should render student list with correct count', () => {
    render(
      <StudentList 
        students={mockStudents} 
        onAttendanceToggle={mockOnAttendanceToggle} 
      />
    );
    
    expect(screen.getByText('Student List (3)')).toBeInTheDocument();
  });

  it('should render all student names and roll numbers', () => {
    render(
      <StudentList 
        students={mockStudents} 
        onAttendanceToggle={mockOnAttendanceToggle} 
      />
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Roll No: 001')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Roll No: 002')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    expect(screen.getByText('Roll No: 003')).toBeInTheDocument();
  });

  it('should display attendance percentages correctly', () => {
    render(
      <StudentList 
        students={mockStudents} 
        onAttendanceToggle={mockOnAttendanceToggle} 
      />
    );
    
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
  });

  it('should display correct status badges', () => {
    render(
      <StudentList 
        students={mockStudents} 
        onAttendanceToggle={mockOnAttendanceToggle} 
      />
    );
    
    // Check for status badges (not buttons or legend)
    const badges = screen.getAllByRole('generic').filter(el => 
      el.textContent === 'Present' || el.textContent === 'Absent' || el.textContent === 'Pending'
    );
    expect(badges.length).toBeGreaterThan(0);
  });

  it('should call onAttendanceToggle when Present button is clicked', () => {
    render(
      <StudentList 
        students={mockStudents} 
        onAttendanceToggle={mockOnAttendanceToggle} 
      />
    );
    
    const presentButtons = screen.getAllByRole('button', { name: /Present/ });
    // Click the button for Jane (who is currently absent) - should be the second button
    fireEvent.click(presentButtons[1]);
    
    expect(mockOnAttendanceToggle).toHaveBeenCalledWith('student-2', 'present');
  });

  it('should call onAttendanceToggle when Absent button is clicked', () => {
    render(
      <StudentList 
        students={mockStudents} 
        onAttendanceToggle={mockOnAttendanceToggle} 
      />
    );
    
    const absentButtons = screen.getAllByRole('button', { name: /Absent/ });
    // Click the button for John (who is currently present) - should be the first button
    fireEvent.click(absentButtons[0]);
    
    expect(mockOnAttendanceToggle).toHaveBeenCalledWith('student-1', 'absent');
  });

  it('should highlight current student during roll call', () => {
    render(
      <StudentList 
        students={mockStudents} 
        onAttendanceToggle={mockOnAttendanceToggle}
        currentStudentIndex={1}
        isRollCallActive={true}
      />
    );
    
    // Find the student row that should be highlighted (Jane Smith - index 1)
    const janeRow = screen.getByText('Jane Smith').closest('.group');
    
    expect(janeRow).toHaveClass('border-primary', 'bg-primary/10');
  });

  it('should disable buttons when loading', () => {
    render(
      <StudentList 
        students={mockStudents} 
        onAttendanceToggle={mockOnAttendanceToggle}
        loading={true}
      />
    );
    
    const presentButtons = screen.getAllByRole('button', { name: /Present/ });
    const absentButtons = screen.getAllByRole('button', { name: /Absent/ });
    
    presentButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
    
    absentButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('should show empty state when no students', () => {
    render(
      <StudentList 
        students={[]} 
        onAttendanceToggle={mockOnAttendanceToggle} 
      />
    );
    
    expect(screen.getByText('No students found for this class.')).toBeInTheDocument();
  });

  it('should show demo data indicator for demo students', () => {
    const demoStudents: Student[] = [
      {
        id: 'demo-student-1',
        first_name: 'Demo',
        last_name: 'Student',
        roll_number: '001',
        attendance_status: 'present',
        attendance_percentage: 85
      }
    ];

    render(
      <StudentList 
        students={demoStudents} 
        onAttendanceToggle={mockOnAttendanceToggle} 
      />
    );
    
    expect(screen.getByText('Demo Data Active')).toBeInTheDocument();
    expect(screen.getByText(/You are currently viewing sample data/)).toBeInTheDocument();
  });

  it('should display status legend', () => {
    render(
      <StudentList 
        students={mockStudents} 
        onAttendanceToggle={mockOnAttendanceToggle} 
      />
    );
    
    // Check for legend items in header - they should be in the legend section
    const legendItems = screen.getAllByText('Present');
    const legendPresent = legendItems.find(item => 
      item.closest('.flex.items-center.space-x-4.text-sm.text-muted-foreground')
    );
    expect(legendPresent).toBeInTheDocument();
  });

  it('should apply correct button styling based on attendance status', () => {
    render(
      <StudentList 
        students={mockStudents} 
        onAttendanceToggle={mockOnAttendanceToggle} 
      />
    );
    
    const presentButtons = screen.getAllByRole('button', { name: /Present/ });
    const absentButtons = screen.getAllByRole('button', { name: /Absent/ });
    
    // John is present, so his Present button should have active styling
    expect(presentButtons[0]).toHaveClass('bg-green-600');
    
    // Jane is absent, so her Absent button should have active styling  
    expect(absentButtons[1]).toHaveClass('bg-red-600');
  });
});