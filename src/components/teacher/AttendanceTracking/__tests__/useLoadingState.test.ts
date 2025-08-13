import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLoadingState } from '../hooks/useLoadingState';

describe('useLoadingState', () => {
  it('should initialize with not loading state', () => {
    const { result } = renderHook(() => useLoadingState());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.loadingState.isLoading).toBe(false);
    expect(result.current.loadingMessage).toBe('');
  });

  it('should set loading state with operation and message', () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.setLoading(true, 'fetching', 'Loading students...');
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.loadingState.isLoading).toBe(true);
    expect(result.current.loadingState.operation).toBe('fetching');
    expect(result.current.loadingState.message).toBe('Loading students...');
    expect(result.current.loadingMessage).toBe('Loading students...');
  });

  it('should generate default message for fetching operation', () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.setLoading(true, 'fetching');
    });

    expect(result.current.loadingMessage).toBe('Loading students...');
  });

  it('should generate default message for saving operation', () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.setLoading(true, 'saving');
    });

    expect(result.current.loadingMessage).toBe('Saving attendance...');
  });

  it('should generate default message for deleting operation', () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.setLoading(true, 'deleting');
    });

    expect(result.current.loadingMessage).toBe('Removing data...');
  });

  it('should generate default message for inserting operation', () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.setLoading(true, 'inserting');
    });

    expect(result.current.loadingMessage).toBe('Adding demo data...');
  });

  it('should generate generic message for unknown operation', () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.loadingMessage).toBe('Processing...');
  });

  it('should clear loading state', () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.setLoading(true, 'fetching', 'Loading...');
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.loadingState.isLoading).toBe(false);
    expect(result.current.loadingMessage).toBe('');
  });

  it('should update loading state multiple times', () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.setLoading(true, 'fetching', 'Loading students...');
    });

    expect(result.current.loadingMessage).toBe('Loading students...');

    act(() => {
      result.current.setLoading(true, 'saving', 'Saving attendance...');
    });

    expect(result.current.loadingMessage).toBe('Saving attendance...');
    expect(result.current.loadingState.operation).toBe('saving');

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.isLoading).toBe(false);
  });
});