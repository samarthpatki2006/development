import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { useAttendanceData } from '../useAttendanceData';
import { useToast } from '@/hooks/use-toast';

// Mock the dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn()
}));

describe('useAttendanceData', () => {
  const mockToast = vi.fn();
  const teacherId = 'teacher-123';

  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as Mock).mockReturnValue({ toast: mockToast });
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useAttendanceData(teacherId));

    expect(result.current.students).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should insert demo data successfully', async () => {
    const { result } = renderHook(() => useAttendanceData(teacherId));

    await act(async () => {
      await result.current.insertDemoData();
    });

    expect(result.current.students).toHaveLength(10);
    expect(result.current.students[0]).toMatchObject({
      first_name: 'Alice',
      last_name: 'Johnson',
      roll_number: 'CS001',
      attendance_status: 'pending',
      attendance_percentage: 85
    });
    expect(mockToast).toHaveBeenCalledWith({
      title: "Demo Data Inserted",
      description: "10 demo students added for testing"
    });
  });

  it('should mark demo attendance successfully', async () => {
    const { result } = renderHook(() => useAttendanceData(teacherId));
    
    await act(async () => {
      await result.current.insertDemoData();
    });

    const studentId = result.current.students[0].id;

    await act(async () => {
      await result.current.markAttendance(studentId, 'present', 'course-123');
    });

    expect(result.current.students[0].attendance_status).toBe('present');
    expect(mockToast).toHaveBeenCalledWith({
      title: "Attendance Updated (Demo)",
      description: "Alice Johnson marked as present"
    });
  });

  it('should clear errors', () => {
    const { result } = renderHook(() => useAttendanceData(teacherId));

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });
});