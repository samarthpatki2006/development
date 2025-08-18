import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEnhancedToast } from '../hooks/useEnhancedToast';
import { useToast } from '@/hooks/use-toast';

// Mock the useToast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn()
}));

describe('useEnhancedToast', () => {
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as any).mockReturnValue({ toast: mockToast });
  });

  it('should show success toast with correct parameters', () => {
    const { result } = renderHook(() => useEnhancedToast());

    result.current.showSuccess({
      title: 'Success!',
      description: 'Operation completed',
      duration: 2000
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Success!',
      description: 'Operation completed',
      duration: 2000,
      action: undefined
    });
  });

  it('should show error toast with correct severity-based duration', () => {
    const { result } = renderHook(() => useEnhancedToast());

    const highSeverityError = {
      type: 'permission' as const,
      message: 'Access denied',
      recoverable: false,
      timestamp: new Date().toISOString()
    };

    result.current.showError(highSeverityError);

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Access denied',
      variant: 'destructive',
      duration: 8000,
      action: undefined
    });
  });

  it('should show error toast with retry action', () => {
    const { result } = renderHook(() => useEnhancedToast());
    const retryAction = vi.fn();

    const networkError = {
      type: 'network' as const,
      message: 'Network failed',
      recoverable: true,
      retryAction,
      timestamp: new Date().toISOString()
    };

    result.current.showError(networkError);

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Network failed',
      variant: 'destructive',
      duration: 5000,
      action: {
        altText: 'Retry',
        label: 'Retry',
        onClick: retryAction
      }
    });
  });

  it('should show attendance update toast for present status', () => {
    const { result } = renderHook(() => useEnhancedToast());

    result.current.showAttendanceUpdate('John Doe', 'present', false);

    expect(mockToast).toHaveBeenCalledWith({
      title: '✅ Attendance Updated',
      description: 'John Doe marked as present',
      duration: 2000,
      action: undefined
    });
  });

  it('should show attendance update toast for absent status with demo flag', () => {
    const { result } = renderHook(() => useEnhancedToast());

    result.current.showAttendanceUpdate('Jane Smith', 'absent', true);

    expect(mockToast).toHaveBeenCalledWith({
      title: '❌ Attendance Updated (Demo)',
      description: 'Jane Smith marked as absent',
      duration: 2000,
      action: undefined
    });
  });

  it('should show operation success toast with emoji', () => {
    const { result } = renderHook(() => useEnhancedToast());

    result.current.showOperationSuccess('demo_data_inserted', '25 students added');

    expect(mockToast).toHaveBeenCalledWith({
      title: '🎯 Demo Data Inserted',
      description: '25 students added',
      duration: 3000,
      action: undefined
    });
  });

  it('should show network error toast with retry action', () => {
    const { result } = renderHook(() => useEnhancedToast());
    const retryAction = vi.fn();

    result.current.showNetworkError(retryAction);

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Network connection failed. Please check your internet connection.',
      variant: 'destructive',
      duration: 5000,
      action: {
        altText: 'Retry',
        label: 'Retry',
        onClick: retryAction
      }
    });
  });

  it('should show warning toast with custom duration', () => {
    const { result } = renderHook(() => useEnhancedToast());

    result.current.showWarning({
      title: 'Warning',
      description: 'This is a warning',
      duration: 6000
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Warning',
      description: 'This is a warning',
      duration: 6000,
      action: undefined
    });
  });

  it('should show info toast with action', () => {
    const { result } = renderHook(() => useEnhancedToast());
    const actionHandler = vi.fn();

    result.current.showInfo({
      title: 'Information',
      description: 'This is info',
      action: {
        label: 'Learn More',
        onClick: actionHandler
      }
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Information',
      description: 'This is info',
      duration: 3000,
      action: {
        altText: 'Learn More',
        label: 'Learn More',
        onClick: actionHandler
      }
    });
  });
});