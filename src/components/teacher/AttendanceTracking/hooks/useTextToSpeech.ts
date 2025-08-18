import { useState, useEffect, useCallback, useRef } from 'react';
import { AttendanceError } from '../utils/errorHandler';

export interface UseTextToSpeechReturn {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSupported: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  error: string | null;
}

export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check browser compatibility on mount with enhanced detection
  useEffect(() => {
    const checkSupport = () => {
      const hasSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;
      const hasSpeechSynthesisUtterance = typeof window !== 'undefined' && 'SpeechSynthesisUtterance' in window;
      
      console.log('Speech support check:', {
        hasSpeechSynthesis,
        hasSpeechSynthesisUtterance,
        userAgent: navigator.userAgent
      });
      
      if (hasSpeechSynthesis && hasSpeechSynthesisUtterance) {
        synthRef.current = window.speechSynthesis;
        
        // Initialize voices - workaround for Safari and Chrome
        if (synthRef.current) {
          try {
            synthRef.current.getVoices();
            
            // Some browsers need an extra voice loading step
            if ('onvoiceschanged' in synthRef.current) {
              synthRef.current.onvoiceschanged = () => {
                console.log('Voices loaded:', synthRef.current?.getVoices().length);
              };
            }
          } catch (e) {
            console.error('Error getting voices:', e);
          }
        }
        
        setIsSupported(true);
        setError(null);
      } else {
        setIsSupported(false);
        const errorMsg = 'Text-to-speech is not supported in this browser. You can still mark attendance manually.';
        setError(errorMsg);
        console.warn('Speech synthesis not supported:', {
          speechSynthesis: hasSpeechSynthesis,
          SpeechSynthesisUtterance: hasSpeechSynthesisUtterance,
          userAgent: navigator.userAgent
        });
      }
    };

    checkSupport();
    
    // Re-check after a short delay for some browsers that need time to initialize
    const recheck = setTimeout(checkSupport, 500);
    return () => clearTimeout(recheck);
  }, []);

  // Monitor speech synthesis state
  useEffect(() => {
    if (!synthRef.current) return;

    const checkSpeakingState = () => {
      if (synthRef.current) {
        setIsSpeaking(synthRef.current.speaking);
        setIsPaused(synthRef.current.paused);
      }
    };

    const interval = setInterval(checkSpeakingState, 100);
    return () => clearInterval(interval);
  }, []);

  const speak = useCallback(async (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!isSupported || !synthRef.current) {
        const error = new AttendanceError(
          'Text-to-speech is not supported in this browser',
          'browser',
          false,
          'Manual attendance marking is still available'
        );
        setError(error.message);
        reject(error);
        return;
      }

      if (!text || text.trim().length === 0) {
        const error = new AttendanceError(
          'No text provided for speech synthesis',
          'validation',
          true,
          'Please provide valid text to speak'
        );
        setError(error.message);
        reject(error);
        return;
      }

      // Stop any current speech
      try {
        synthRef.current.cancel();
      } catch (cancelError) {
        console.warn('Error canceling previous speech:', cancelError);
      }

      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;

        // Configure speech settings for better clarity
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Try to use a clear voice if available
        const voices = synthRef.current.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.lang.startsWith('en') && voice.localService
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        // Set up event handlers with enhanced error handling
        utterance.onstart = () => {
          console.log('Speech started');
          setIsSpeaking(true);
          setIsPaused(false);
          setError(null);
        };

        utterance.onend = () => {
          console.log('Speech ended');
          setIsSpeaking(false);
          setIsPaused(false);
          resolve();
        };

        utterance.onerror = (event) => {
          console.error('Speech synthesis error event:', event);
          const errorMessage = event.error || 'Unknown speech error';
          const error = new AttendanceError(
            `Speech synthesis failed: ${errorMessage}`,
            'browser',
            true,
            `Error details: ${errorMessage} | Text: "${text.substring(0, 50)}..."`
          );
          setError(error.message);
          setIsSpeaking(false);
          setIsPaused(false);
          reject(error);
        };

        utterance.onpause = () => {
          console.log('Speech paused');
          setIsPaused(true);
        };

        utterance.onresume = () => {
          console.log('Speech resumed');
          setIsPaused(false);
        };

        // Set up timer before speaking to prevent race conditions
        setTimeout(() => {
          try {
            // Start speaking with timeout fallback
            console.log('Speaking:', text);
            synthRef.current?.speak(utterance);
            
            // Fallback timeout in case speech gets stuck
            const timeout = setTimeout(() => {
              if (isSpeaking) {
                const error = new AttendanceError(
                  'Speech synthesis timed out',
                  'browser',
                  true,
                  'Speech may have gotten stuck, trying to recover'
                );
                setError(error.message);
                setIsSpeaking(false);
                setIsPaused(false);
                synthRef.current?.cancel();
                reject(error);
              }
            }, 10000); // 10 second timeout

            // Re-define onend to include the timeout clear
            utterance.onend = () => {
              console.log('Speech ended (final handler)');
              clearTimeout(timeout);
              setIsSpeaking(false);
              setIsPaused(false);
              resolve();
            };
          } catch (err) {
            console.error('Error starting speech:', err);
            reject(new AttendanceError(
              'Failed to start speech synthesis',
              'browser',
              true,
              err instanceof Error ? err.message : 'Unknown error starting speech'
            ));
          }
        }, 100); // Small delay to ensure all event handlers are attached

      } catch (err) {
        const error = new AttendanceError(
          'Failed to initialize speech synthesis',
          'browser',
          true,
          err instanceof Error ? err.message : 'Unknown initialization error'
        );
        setError(error.message);
        setIsSpeaking(false);
        setIsPaused(false);
        reject(error);
      }
    });
  }, [isSupported, isSpeaking]);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []);

  const pause = useCallback(() => {
    if (synthRef.current && synthRef.current.speaking && !synthRef.current.paused) {
      synthRef.current.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (synthRef.current && synthRef.current.paused) {
      synthRef.current.resume();
      setIsPaused(false);
    }
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isSupported,
    isSpeaking,
    isPaused,
    error
  };
};