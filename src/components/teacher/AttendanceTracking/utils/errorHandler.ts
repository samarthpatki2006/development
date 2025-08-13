import { ErrorState, FallbackUIState } from '../types';

export class AttendanceError extends Error {
  constructor(
    message: string,
    public type: ErrorState['type'],
    public recoverable: boolean = true,
    public details?: string
  ) {
    super(message);
    this.name = 'AttendanceError';
  }
}

export const createErrorState = (
  error: Error | AttendanceError,
  context: string,
  retryAction?: () => void
): ErrorState => {
  const timestamp = new Date().toISOString();
  
  // Handle custom AttendanceError
  if (error instanceof AttendanceError) {
    return {
      type: error.type,
      message: error.message,
      recoverable: error.recoverable,
      details: error.details,
      timestamp,
      retryAction
    };
  }

  // Handle common error patterns
  const errorMessage = error.message.toLowerCase();
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
    return {
      type: 'network',
      message: 'Network connection failed. Please check your internet connection and try again.',
      recoverable: true,
      details: `Context: ${context} | Original: ${error.message}`,
      timestamp,
      retryAction
    };
  }
  
  if (errorMessage.includes('permission') || errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
    return {
      type: 'permission',
      message: 'You do not have permission to perform this action. Please contact your administrator.',
      recoverable: false,
      details: `Context: ${context} | Original: ${error.message}`,
      timestamp
    };
  }
  
  if (errorMessage.includes('validation') || errorMessage.includes('invalid') || errorMessage.includes('required')) {
    return {
      type: 'validation',
      message: 'Invalid data provided. Please check your input and try again.',
      recoverable: true,
      details: `Context: ${context} | Original: ${error.message}`,
      timestamp,
      retryAction
    };
  }
  
  if (errorMessage.includes('database') || errorMessage.includes('sql') || errorMessage.includes('constraint')) {
    return {
      type: 'database',
      message: 'Database error occurred. Please try again in a moment.',
      recoverable: true,
      details: `Context: ${context} | Original: ${error.message}`,
      timestamp,
      retryAction
    };
  }
  
  if (errorMessage.includes('speech') || errorMessage.includes('synthesis') || errorMessage.includes('audio')) {
    return {
      type: 'browser',
      message: 'Text-to-speech is not available. You can still mark attendance manually.',
      recoverable: false,
      details: `Context: ${context} | Original: ${error.message}`,
      timestamp
    };
  }
  
  // Default unknown error
  return {
    type: 'unknown',
    message: 'An unexpected error occurred. Please try again.',
    recoverable: true,
    details: `Context: ${context} | Original: ${error.message}`,
    timestamp,
    retryAction
  };
};

export const createFallbackUIState = (
  type: FallbackUIState['type'],
  actionHandler?: () => void
): FallbackUIState => {
  switch (type) {
    case 'network_error':
      return {
        type,
        title: 'Connection Problem',
        message: 'Unable to connect to the server. Please check your internet connection.',
        actionLabel: 'Retry',
        actionHandler
      };
    
    case 'browser_incompatible':
      return {
        type,
        title: 'Browser Not Supported',
        message: 'Some features may not work properly in this browser. Consider using a modern browser like Chrome, Firefox, or Safari.',
        actionLabel: 'Continue Anyway',
        actionHandler
      };
    
    case 'no_data':
      return {
        type,
        title: 'No Students Found',
        message: 'No students are enrolled in this class yet. Click below to load demo data for testing the attendance tracking features.',
        actionLabel: 'Load Demo Students',
        actionHandler
      };
    
    case 'permission_denied':
      return {
        type,
        title: 'Access Denied',
        message: 'You do not have permission to access this feature. Please contact your administrator.',
        actionLabel: 'Contact Support',
        actionHandler
      };
    
    default:
      return {
        type: 'network_error',
        title: 'Something went wrong',
        message: 'An unexpected error occurred. Please try again.',
        actionLabel: 'Retry',
        actionHandler
      };
  }
};

export const getErrorSeverity = (error: ErrorState): 'low' | 'medium' | 'high' => {
  switch (error.type) {
    case 'permission':
      return 'high';
    case 'database':
    case 'network':
      return 'medium';
    case 'browser':
    case 'validation':
    case 'unknown':
    default:
      return 'low';
  }
};

export const shouldShowRetry = (error: ErrorState): boolean => {
  return error.recoverable && !!error.retryAction;
};

export const getErrorIcon = (error: ErrorState): string => {
  switch (error.type) {
    case 'network':
      return 'wifi-off';
    case 'browser':
      return 'alert-triangle';
    case 'permission':
      return 'lock';
    case 'database':
      return 'database';
    case 'validation':
      return 'alert-circle';
    default:
      return 'x-circle';
  }
};