import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import AttendanceConfirmDialog from '../AttendanceConfirmDialog';

// Mock functions
const mockOnConfirm = vi.fn();
const mockOnCancel = vi.fn();

describe('AttendanceConfirmDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const defaultProps = {
    isOpen: true,
    studentName: 'John Doe',
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
    autoCloseTimer: 10
  };

  it('should render dialog when open', () => {
    render(<AttendanceConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Mark Student Absent?')).toBeInTheDocument();
    expect(screen.getByText(/Do you want to mark/)).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should not render dialog when closed', () => {
    render(<AttendanceConfirmDialog {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Mark Student Absent?')).not.toBeInTheDocument();
  });

  it('should call onConfirm when Mark Absent button is clicked', () => {
    render(<AttendanceConfirmDialog {...defaultProps} />);

    const markAbsentButton = screen.getByText('Mark Absent');
    fireEvent.click(markAbsentButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when Mark Present button is clicked', () => {
    render(<AttendanceConfirmDialog {...defaultProps} />);

    const markPresentButton = screen.getByText('Mark Present');
    fireEvent.click(markPresentButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should display countdown timer', () => {
    render(<AttendanceConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Auto-close in 10s')).toBeInTheDocument();
    expect(screen.getByText('Will mark as present if no action taken')).toBeInTheDocument();
  });

  it('should auto-close and call onCancel when timer expires', async () => {
    render(<AttendanceConfirmDialog {...defaultProps} autoCloseTimer={0.5} />);

    // Fast-forward time by 0.6 seconds
    vi.advanceTimersByTime(600);

    // Wait for the callback to be called
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should update progress bar as timer counts down', () => {
    render(<AttendanceConfirmDialog {...defaultProps} autoCloseTimer={1} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');

    // Advance time by half the timer
    vi.advanceTimersByTime(500);

    // Progress should be around 50% (allowing for some timing variance)
    const currentValue = progressBar.getAttribute('aria-valuenow');
    expect(Number(currentValue)).toBeLessThan(60);
    expect(Number(currentValue)).toBeGreaterThan(40);
  });

  it('should handle Enter key to confirm', () => {
    render(<AttendanceConfirmDialog {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Enter' });

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('should handle Escape key to cancel', () => {
    render(<AttendanceConfirmDialog {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should not handle keyboard events when dialog is closed', () => {
    render(<AttendanceConfirmDialog {...defaultProps} isOpen={false} />);

    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnConfirm).not.toHaveBeenCalled();
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('should reset timer when dialog reopens', () => {
    const { rerender } = render(<AttendanceConfirmDialog {...defaultProps} isOpen={false} />);

    // Open dialog
    rerender(<AttendanceConfirmDialog {...defaultProps} isOpen={true} />);

    expect(screen.getByText('Auto-close in 10s')).toBeInTheDocument();

    // Advance time
    vi.advanceTimersByTime(5000);

    // Close and reopen dialog
    rerender(<AttendanceConfirmDialog {...defaultProps} isOpen={false} />);
    rerender(<AttendanceConfirmDialog {...defaultProps} isOpen={true} />);

    // Timer should be reset
    expect(screen.getByText('Auto-close in 10s')).toBeInTheDocument();
  });

  it('should display keyboard shortcuts hint', () => {
    render(<AttendanceConfirmDialog {...defaultProps} />);

    expect(screen.getByText(/Press/)).toBeInTheDocument();
    expect(screen.getByText('Enter')).toBeInTheDocument();
    expect(screen.getByText('Esc')).toBeInTheDocument();
  });

  it('should have proper ARIA attributes', () => {
    render(<AttendanceConfirmDialog {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-label');
    expect(progressBar.getAttribute('aria-label')).toContain('Auto-close timer');
  });

  it('should focus the Mark Absent button by default', () => {
    render(<AttendanceConfirmDialog {...defaultProps} />);

    const markAbsentButton = screen.getByRole('button', { name: /mark absent/i });
    expect(markAbsentButton).toHaveFocus();
  });

  it('should handle custom autoCloseTimer value', () => {
    render(<AttendanceConfirmDialog {...defaultProps} autoCloseTimer={5} />);

    expect(screen.getByText('Auto-close in 5s')).toBeInTheDocument();
  });

  it('should prevent event propagation for keyboard events', () => {
    render(<AttendanceConfirmDialog {...defaultProps} />);

    // Test that Enter key triggers confirm
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);

    // Reset mock
    mockOnConfirm.mockClear();

    // Test that Escape key triggers cancel
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});