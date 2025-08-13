import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AttendanceTracking from '../AttendanceTracking';
import { useAttendanceData } from '../hooks/useAttendanceData';

// Mock the hook
vi.mock('../hooks/useAttendanceData');

describe('AttendanceTracking', () => {
  const mockTeacherData = {
    user_id: 'teacher-123',
    first_name: 'John',
    last_name: 'Doe'
  };

  const mockUseAttendanceData = {
    students: [],
    loading: false,
    loadingState: { isLoading: false },
    error: null,
    fetchStudents: vi.fn(),
    insertDemoData: vi.fn(),
    markAttendance: vi.fn(),
    clearError: vi.fn(),
    retryLastOperation: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAttendanceData as any).mockReturnValue(mockUseAttendanceData);
  });

  it('renders the attendance tracking interface', () => {
    render(<AttendanceTracking teacherData={mockTeacherData} />);
    
    expect(screen.getByText('Attendance Tracking')).toBeInTheDocument();
    expect(screen.getByText('Efficiently mark and track student attendance with interactive tools')).toBeInTheDocument();
    expect(screen.getByText('Select Class')).toBeInTheDocument();
  });

  it('shows course selection dropdown', () => {
    render(<AttendanceTracking teacherData={mockTeacherData} />);
    
    expect(screen.getByText('Choose a class to mark attendance')).toBeInTheDocument();
  });

  it('calls fetchStudents when course is selected', async () => {
    render(<AttendanceTracking teacherData={mockTeacherData} />);
    
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);
    
    const courseOption = screen.getByText('CS101 - Computer Science 101');
    fireEvent.click(courseOption);
    
    await waitFor(() => {
      expect(mockUseAttendanceData.fetchStudents).toHaveBeenCalledWith('1');
    });
  });

  it('shows demo data button when no students', () => {
    render(<AttendanceTracking teacherData={mockTeacherData} />);
    
    // Select a course first
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);
    const courseOption = screen.getByText('CS101 - Computer Science 101');
    fireEvent.click(courseOption);
    
    expect(screen.getByText('No Data Available')).toBeInTheDocument();
    expect(screen.getByText('Insert Demo Data')).toBeInTheDocument();
  });

  it('calls insertDemoData when demo button is clicked', async () => {
    render(<AttendanceTracking teacherData={mockTeacherData} />);
    
    // Select a course first
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);
    const courseOption = screen.getByText('CS101 - Computer Science 101');
    fireEvent.click(courseOption);
    
    const demoButton = screen.getByText('Insert Demo Data');
    fireEvent.click(demoButton);
    
    await waitFor(() => {
      expect(mockUseAttendanceData.insertDemoData).toHaveBeenCalled();
    });
  });

  it('displays students when available', () => {
    const mockStudents = [
      {
        id: 'student-1',
        first_name: 'Alice',
        last_name: 'Johnson',
        roll_number: 'CS001',
        attendance_status: 'pending' as const,
        attendance_percentage: 85
      }
    ];

    (useAttendanceData as any).mockReturnValue({
      ...mockUseAttendanceData,
      students: mockStudents
    });

    render(<AttendanceTracking teacherData={mockTeacherData} />);
    
    // Select a course first
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);
    const courseOption = screen.getByText('CS101 - Computer Science 101');
    fireEvent.click(courseOption);
    
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Roll No: CS001')).toBeInTheDocument();
    expect(screen.getByText('Overall Attendance')).toBeInTheDocument();
  });

  it('shows demo data indicator for demo students', () => {
    const mockStudents = [
      {
        id: 'demo-student-1',
        first_name: 'Alice',
        last_name: 'Johnson',
        roll_number: 'CS001',
        attendance_status: 'pending' as const,
        attendance_percentage: 85
      }
    ];

    (useAttendanceData as any).mockReturnValue({
      ...mockUseAttendanceData,
      students: mockStudents
    });

    render(<AttendanceTracking teacherData={mockTeacherData} />);
    
    // Select a course first
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);
    const courseOption = screen.getByText('CS101 - Computer Science 101');
    fireEvent.click(courseOption);
    
    expect(screen.getByText(/You are currently viewing sample data/)).toBeInTheDocument();
  });

  it('displays error messages', () => {
    const mockError = {
      type: 'network' as const,
      message: 'Network connection failed',
      recoverable: true,
      retryAction: vi.fn()
    };

    (useAttendanceData as any).mockReturnValue({
      ...mockUseAttendanceData,
      error: mockError
    });

    render(<AttendanceTracking teacherData={mockTeacherData} />);
    
    expect(screen.getByText('Network connection failed')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('calls markAttendance when attendance buttons are clicked', async () => {
    const mockStudents = [
      {
        id: 'student-1',
        first_name: 'Alice',
        last_name: 'Johnson',
        roll_number: 'CS001',
        attendance_status: 'pending' as const,
        attendance_percentage: 85
      }
    ];

    (useAttendanceData as any).mockReturnValue({
      ...mockUseAttendanceData,
      students: mockStudents
    });

    render(<AttendanceTracking teacherData={mockTeacherData} />);
    
    // Select a course first
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);
    const courseOption = screen.getByText('CS101 - Computer Science 101');
    fireEvent.click(courseOption);
    
    const presentButtons = screen.getAllByText('Present');
    fireEvent.click(presentButtons[presentButtons.length - 1]); // Click the button, not the text
    
    await waitFor(() => {
      expect(mockUseAttendanceData.markAttendance).toHaveBeenCalledWith('student-1', 'present', '1');
    });
  });
});