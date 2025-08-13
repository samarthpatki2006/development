import { renderHook, act } from '@testing-library/react';
import { useTextToSpeech } from '../useTextToSpeech';

// Simple test focusing on core functionality
describe('useTextToSpeech', () => {
  beforeEach(() => {
    // Mock SpeechSynthesis API
    const mockSpeechSynthesis = {
      speak: vi.fn(),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      speaking: false,
      paused: false,
    };

    const mockSpeechSynthesisUtterance = vi.fn().mockImplementation(() => ({
      onstart: null,
      onend: null,
      onerror: null,
      onpause: null,
      onresume: null,
      rate: 1,
      pitch: 1,
      volume: 1,
    }));

    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      configurable: true,
      value: mockSpeechSynthesis,
    });

    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      writable: true,
      configurable: true,
      value: mockSpeechSynthesisUtterance,
    });
  });

  it('should detect browser support correctly', () => {
    const { result } = renderHook(() => useTextToSpeech());
    expect(result.current.isSupported).toBe(true);
  });

  it('should handle unsupported browsers', () => {
    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      configurable: true,
      value: undefined,
    });

    const { result } = renderHook(() => useTextToSpeech());
    expect(result.current.isSupported).toBe(false);
    expect(result.current.error).toBe('Text-to-speech is not supported in this browser');
  });

  it('should provide speak, stop, pause, and resume functions', () => {
    const { result } = renderHook(() => useTextToSpeech());
    
    expect(typeof result.current.speak).toBe('function');
    expect(typeof result.current.stop).toBe('function');
    expect(typeof result.current.pause).toBe('function');
    expect(typeof result.current.resume).toBe('function');
  });

  it('should call speechSynthesis.cancel when stop is called', () => {
    const { result } = renderHook(() => useTextToSpeech());
    
    act(() => {
      result.current.stop();
    });

    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
  });

  it('should call speechSynthesis.pause when pause is called with speaking state', () => {
    // @ts-ignore
    window.speechSynthesis.speaking = true;
    // @ts-ignore
    window.speechSynthesis.paused = false;

    const { result } = renderHook(() => useTextToSpeech());
    
    act(() => {
      result.current.pause();
    });

    expect(window.speechSynthesis.pause).toHaveBeenCalled();
  });

  it('should call speechSynthesis.resume when resume is called with paused state', () => {
    // @ts-ignore
    window.speechSynthesis.paused = true;

    const { result } = renderHook(() => useTextToSpeech());
    
    act(() => {
      result.current.resume();
    });

    expect(window.speechSynthesis.resume).toHaveBeenCalled();
  });
});