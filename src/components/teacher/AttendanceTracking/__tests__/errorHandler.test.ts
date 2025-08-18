import { describe, it, expect, vi } from 'vitest';
import { 
  AttendanceError, 
  createErrorState, 
  createFallbackUIState, 
  getErrorSeverity,
  shouldShowRetry 
} from '../utils/errorHandler';

describe('AttendanceError', () => {
  it('should create an AttendanceError with correct properties', () => {
    const error = new AttendanceError(
      'Test error message',
      'network',
      true,
      'Additional details'
    );

    expect(error.message).toBe('Test error message');
    expect(error.type).toBe('network');
    expect(error.recoverable).toBe(true);
    expect(error.details).toBe('Additional details');
    expect(error.name).toBe('AttendanceError');
  });
});

describe('createErrorState', () => {
  it('should handle AttendanceError correctly', () => {
    const attendanceError = new AttendanceError(
      'Custom error',
      'validation',
      false,
      'Custom details'
    );
    const retryAction = vi.fn();

    const errorState = createErrorState(attendanceError, 'test context', retryAction);

    expect(errorState.type).toBe('validation');
    expect(errorState.message).toBe('Custom error');
    expect(errorState.recoverable).toBe(false);
    expect(errorState.details).toBe('Custom details');
    expect(errorState.retryAction).toBe(retryAction);
    expect(errorState.timestamp).toBeDefined();
  });

  it('should categorize network errors correctly', () => {
    const networkError = new Error('Network connection failed');
    const errorState = createErrorState(networkError, 'fetchStudents');

    expect(errorState.type).toBe('network');
    expect(errorState.message).toBe('Network connection failed. Please check your internet connection and try again.');
    expect(errorState.recoverable).toBe(true);
    expect(errorState.details).toContain('fetchStudents');
  });

  it('should categorize permission errors correctly', () => {
    const permissionError = new Error('Unauthorized access');
    const errorState = createErrorState(permissionError, 'markAttendance');

    expect(errorState.type).toBe('permission');
    expect(errorState.message).toBe('You do not have permission to perform this action. Please contact your administrator.');
    expect(errorState.recoverable).toBe(false);
  });

  it('should categorize validation errors correctly', () => {
    const validationError = new Error('Invalid data provided');
    const errorState = createErrorState(validationError, 'insertDemoData');

    expect(errorState.type).toBe('validation');
    expect(errorState.message).toBe('Invalid data provided. Please check your input and try again.');
    expect(errorState.recoverable).toBe(true);
  });

  it('should categorize database errors correctly', () => {
    const databaseError = new Error('Database constraint violation');
    const errorState = createErrorState(databaseError, 'saveAttendance');

    expect(errorState.type).toBe('database');
    expect(errorState.message).toBe('Database error occurred. Please try again in a moment.');
    expect(errorState.recoverable).toBe(true);
  });

  it('should categorize browser errors correctly', () => {
    const browserError = new Error('Speech synthesis not supported');
    const errorState = createErrorState(browserError, 'textToSpeech');

    expect(errorState.type).toBe('browser');
    expect(errorState.message).toBe('Text-to-speech is not available. You can still mark attendance manually.');
    expect(errorState.recoverable).toBe(false);
  });

  it('should handle unknown errors correctly', () => {
    const unknownError = new Error('Something unexpected happened');
    const errorState = createErrorState(unknownError, 'unknownOperation');

    expect(errorState.type).toBe('unknown');
    expect(errorState.message).toBe('An unexpected error occurred. Please try again.');
    expect(errorState.recoverable).toBe(true);
  });
});

describe('createFallbackUIState', () => {
  it('should create network error fallback state', () => {
    const actionHandler = vi.fn();
    const fallbackState = createFallbackUIState('network_error', actionHandler);

    expect(fallbackState.type).toBe('network_error');
    expect(fallbackState.title).toBe('Connection Problem');
    expect(fallbackState.actionLabel).toBe('Retry');
    expect(fallbackState.actionHandler).toBe(actionHandler);
  });

  it('should create browser incompatible fallback state', () => {
    const fallbackState = createFallbackUIState('browser_incompatible');

    expect(fallbackState.type).toBe('browser_incompatible');
    expect(fallbackState.title).toBe('Browser Not Supported');
    expect(fallbackState.actionLabel).toBe('Continue Anyway');
  });

  it('should create no data fallback state', () => {
    const actionHandler = vi.fn();
    const fallbackState = createFallbackUIState('no_data', actionHandler);

    expect(fallbackState.type).toBe('no_data');
    expect(fallbackState.title).toBe('No Data Available');
    expect(fallbackState.actionLabel).toBe('Insert Demo Data');
    expect(fallbackState.actionHandler).toBe(actionHandler);
  });

  it('should create permission denied fallback state', () => {
    const fallbackState = createFallbackUIState('permission_denied');

    expect(fallbackState.type).toBe('permission_denied');
    expect(fallbackState.title).toBe('Access Denied');
    expect(fallbackState.actionLabel).toBe('Contact Support');
  });
});

describe('getErrorSeverity', () => {
  it('should return high severity for permission errors', () => {
    const errorState = { type: 'permission' as const, message: '', recoverable: false };
    expect(getErrorSeverity(errorState)).toBe('high');
  });

  it('should return medium severity for network and database errors', () => {
    const networkError = { type: 'network' as const, message: '', recoverable: true };
    const databaseError = { type: 'database' as const, message: '', recoverable: true };
    
    expect(getErrorSeverity(networkError)).toBe('medium');
    expect(getErrorSeverity(databaseError)).toBe('medium');
  });

  it('should return low severity for other errors', () => {
    const browserError = { type: 'browser' as const, message: '', recoverable: false };
    const validationError = { type: 'validation' as const, message: '', recoverable: true };
    const unknownError = { type: 'unknown' as const, message: '', recoverable: true };
    
    expect(getErrorSeverity(browserError)).toBe('low');
    expect(getErrorSeverity(validationError)).toBe('low');
    expect(getErrorSeverity(unknownError)).toBe('low');
  });
});

describe('shouldShowRetry', () => {
  it('should return true for recoverable errors with retry action', () => {
    const errorState = { 
      type: 'network' as const, 
      message: '', 
      recoverable: true, 
      retryAction: vi.fn() 
    };
    expect(shouldShowRetry(errorState)).toBe(true);
  });

  it('should return false for non-recoverable errors', () => {
    const errorState = { 
      type: 'permission' as const, 
      message: '', 
      recoverable: false, 
      retryAction: vi.fn() 
    };
    expect(shouldShowRetry(errorState)).toBe(false);
  });

  it('should return false for recoverable errors without retry action', () => {
    const errorState = { 
      type: 'network' as const, 
      message: '', 
      recoverable: true 
    };
    expect(shouldShowRetry(errorState)).toBe(false);
  });
});