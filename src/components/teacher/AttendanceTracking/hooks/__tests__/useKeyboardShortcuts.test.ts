import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock functions
const mockOnSpacePress = vi.fn();
const mockOnEscapePress = vi.fn();

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any event listeners
    document.removeEventListener('keydown', expect.any(Function));
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() =>
      useKeyboardShortcuts({
        onSpacePress: mockOnSpacePress,
        onEscapePress: mockOnEscapePress,
        isActive: false
      })
    );

    expect(result.current.isListening).toBe(false);
  });

  it('should set isListening to true when active', () => {
    const { result } = renderHook(() =>
      useKeyboardShortcuts({
        onSpacePress: mockOnSpacePress,
        onEscapePress: mockOnEscapePress,
        isActive: true
      })
    );

    expect(result.current.isListening).toBe(true);
  });

  it('should call onSpacePress when spacebar is pressed and active', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        onSpacePress: mockOnSpacePress,
        onEscapePress: mockOnEscapePress,
        isActive: true
      })
    );

    // Simulate spacebar press
    const event = new KeyboardEvent('keydown', { code: 'Space' });
    document.dispatchEvent(event);

    expect(mockOnSpacePress).toHaveBeenCalledTimes(1);
  });

  it('should call onEscapePress when escape is pressed and active', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        onSpacePress: mockOnSpacePress,
        onEscapePress: mockOnEscapePress,
        isActive: true
      })
    );

    // Simulate escape press
    const event = new KeyboardEvent('keydown', { code: 'Escape' });
    document.dispatchEvent(event);

    expect(mockOnEscapePress).toHaveBeenCalledTimes(1);
  });

  it('should not call handlers when inactive', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        onSpacePress: mockOnSpacePress,
        onEscapePress: mockOnEscapePress,
        isActive: false
      })
    );

    // Simulate spacebar press
    const spaceEvent = new KeyboardEvent('keydown', { code: 'Space' });
    document.dispatchEvent(spaceEvent);

    // Simulate escape press
    const escapeEvent = new KeyboardEvent('keydown', { code: 'Escape' });
    document.dispatchEvent(escapeEvent);

    expect(mockOnSpacePress).not.toHaveBeenCalled();
    expect(mockOnEscapePress).not.toHaveBeenCalled();
  });

  it('should not call handlers when target is an input field', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        onSpacePress: mockOnSpacePress,
        onEscapePress: mockOnEscapePress,
        isActive: true
      })
    );

    // Create a mock input element
    const input = document.createElement('input');
    document.body.appendChild(input);

    // Simulate spacebar press on input
    const event = new KeyboardEvent('keydown', { code: 'Space' });
    Object.defineProperty(event, 'target', { value: input });
    document.dispatchEvent(event);

    expect(mockOnSpacePress).not.toHaveBeenCalled();

    // Clean up
    document.body.removeChild(input);
  });

  it('should not call handlers when target is a textarea', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        onSpacePress: mockOnSpacePress,
        onEscapePress: mockOnEscapePress,
        isActive: true
      })
    );

    // Create a mock textarea element
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    // Simulate spacebar press on textarea
    const event = new KeyboardEvent('keydown', { code: 'Space' });
    Object.defineProperty(event, 'target', { value: textarea });
    document.dispatchEvent(event);

    expect(mockOnSpacePress).not.toHaveBeenCalled();

    // Clean up
    document.body.removeChild(textarea);
  });

  it('should not call handlers when target is contenteditable', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        onSpacePress: mockOnSpacePress,
        onEscapePress: mockOnEscapePress,
        isActive: true
      })
    );

    // Create a mock contenteditable element
    const div = document.createElement('div');
    div.contentEditable = 'true';
    document.body.appendChild(div);

    // Simulate spacebar press on contenteditable
    const event = new KeyboardEvent('keydown', { code: 'Space' });
    Object.defineProperty(event, 'target', { value: div });
    document.dispatchEvent(event);

    expect(mockOnSpacePress).not.toHaveBeenCalled();

    // Clean up
    document.body.removeChild(div);
  });

  it('should prevent default behavior for handled keys', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        onSpacePress: mockOnSpacePress,
        onEscapePress: mockOnEscapePress,
        isActive: true
      })
    );

    // Create spy for preventDefault
    const preventDefaultSpy = vi.fn();
    const stopPropagationSpy = vi.fn();

    // Simulate spacebar press
    const event = new KeyboardEvent('keydown', { code: 'Space' });
    event.preventDefault = preventDefaultSpy;
    event.stopPropagation = stopPropagationSpy;
    document.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('should update isListening when isActive changes', () => {
    const { result, rerender } = renderHook(
      ({ isActive }) =>
        useKeyboardShortcuts({
          onSpacePress: mockOnSpacePress,
          onEscapePress: mockOnEscapePress,
          isActive
        }),
      { initialProps: { isActive: false } }
    );

    expect(result.current.isListening).toBe(false);

    // Change to active
    rerender({ isActive: true });
    expect(result.current.isListening).toBe(true);

    // Change back to inactive
    rerender({ isActive: false });
    expect(result.current.isListening).toBe(false);
  });
});