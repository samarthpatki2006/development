import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ErrorState } from '../types';
import { getErrorSeverity } from '../utils/errorHandler';

interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface UseEnhancedToastReturn {
  showSuccess: (options: ToastOptions) => void;
  showError: (error: ErrorState) => void;
  showWarning: (options: ToastOptions) => void;
  showInfo: (options: ToastOptions) => void;
  showAttendanceUpdate: (studentName: string, status: 'present' | 'absent', isDemo?: boolean) => void;
  showOperationSuccess: (operation: string, details?: string) => void;
  showNetworkError: (retryAction?: () => void) => void;
}

export const useEnhancedToast = (): UseEnhancedToastReturn => {
  const { toast } = useToast();

  const showSuccess = useCallback((options: ToastOptions) => {
    toast({
      title: options.title,
      description: options.description,
      duration: options.duration || 3000,
      action: options.action ? {
        altText: options.action.label,
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined
    });
  }, [toast]);

  const showError = useCallback((error: ErrorState) => {
    const severity = getErrorSeverity(error);
    const duration = severity === 'high' ? 8000 : severity === 'medium' ? 5000 : 3000;

    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
      duration,
      action: error.retryAction ? {
        altText: "Retry",
        label: "Retry",
        onClick: error.retryAction
      } : undefined
    });
  }, [toast]);

  const showWarning = useCallback((options: ToastOptions) => {
    toast({
      title: options.title,
      description: options.description,
      duration: options.duration || 4000,
      action: options.action ? {
        altText: options.action.label,
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined
    });
  }, [toast]);

  const showInfo = useCallback((options: ToastOptions) => {
    toast({
      title: options.title,
      description: options.description,
      duration: options.duration || 3000,
      action: options.action ? {
        altText: options.action.label,
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined
    });
  }, [toast]);

  const showAttendanceUpdate = useCallback((
    studentName: string, 
    status: 'present' | 'absent', 
    isDemo: boolean = false
  ) => {
    const statusEmoji = status === 'present' ? '✅' : '❌';
    const demoText = isDemo ? ' (Demo)' : '';
    
    showSuccess({
      title: `${statusEmoji} Attendance Updated${demoText}`,
      description: `${studentName} marked as ${status}`,
      duration: 2000
    });
  }, [showSuccess]);

  const showOperationSuccess = useCallback((operation: string, details?: string) => {
    const operationEmojis: Record<string, string> = {
      'demo_data_inserted': '🎯',
      'students_loaded': '📚',
      'attendance_saved': '💾',
      'roll_call_completed': '🎉'
    };

    showSuccess({
      title: `${operationEmojis[operation] || '✅'} ${operation.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
      description: details,
      duration: 3000
    });
  }, [showSuccess]);

  const showNetworkError = useCallback((retryAction?: () => void) => {
    showError({
      type: 'network',
      message: 'Network connection failed. Please check your internet connection.',
      recoverable: true,
      retryAction,
      timestamp: new Date().toISOString()
    });
  }, [showError]);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showAttendanceUpdate,
    showOperationSuccess,
    showNetworkError
  };
};