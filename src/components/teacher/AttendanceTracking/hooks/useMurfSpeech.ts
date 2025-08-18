import { useState, useCallback } from 'react';

interface MurfSpeechOptions {
  voice?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
}

interface MurfSpeechResponse {
  audioUrl?: string;
  error?: string;
}

export const useMurfSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MURF_API_KEY = 'ap2_0559f284-92e5-4f85-8e59-c62147aa52f0';
  const MURF_API_URL = 'https://api.murf.ai/v1/speech/generate';

  // Fallback to browser speech synthesis
  const fallbackSpeak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';
      
      setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      speechSynthesis.speak(utterance);
      return true;
    }
    return false;
  }, []);

  const speak = useCallback(async (
    text: string, 
    options: MurfSpeechOptions = {}
  ): Promise<MurfSpeechResponse> => {
    if (!text.trim()) {
      return { error: 'No text provided' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const requestBody = {
        text: text,
        voice: options.voice || 'en-US-Neural2-F',
        speed: options.speed || 1.0,
        pitch: options.pitch || 0,
        volume: options.volume || 1.0,
        format: 'mp3',
        quality: 'high'
      };

      const response = await fetch(MURF_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MURF_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.audioUrl) {
        // Play the audio
        const audio = new Audio(data.audioUrl);
        setIsSpeaking(true);
        
        audio.onended = () => {
          setIsSpeaking(false);
        };
        
        audio.onerror = () => {
          setIsSpeaking(false);
          setError('Failed to play audio');
          // Fallback to browser speech synthesis
          fallbackSpeak(text);
        };
        
        await audio.play();
        
        return { audioUrl: data.audioUrl };
      } else {
        throw new Error('No audio URL received from Murf API');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsSpeaking(false);
      
      // Fallback to browser speech synthesis
      const fallbackSuccess = fallbackSpeak(text);
      if (!fallbackSuccess) {
        return { error: errorMessage };
      }
      
      return { error: 'Using fallback speech synthesis' };
    } finally {
      setIsLoading(false);
    }
  }, [fallbackSpeak]);

  const stop = useCallback(() => {
    // Stop any currently playing audio
    const audios = document.querySelectorAll('audio');
    audios.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    
    // Stop browser speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    
    setIsSpeaking(false);
  }, []);

  const pause = useCallback(() => {
    const audios = document.querySelectorAll('audio');
    audios.forEach(audio => {
      audio.pause();
    });
    
    // Pause browser speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthesis.pause();
    }
    
    setIsSpeaking(false);
  }, []);

  const resume = useCallback(() => {
    const audios = document.querySelectorAll('audio');
    audios.forEach(audio => {
      audio.play();
      setIsSpeaking(true);
    });
    
    // Resume browser speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthesis.resume();
      setIsSpeaking(true);
    }
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isLoading,
    error,
    clearError: () => setError(null)
  };
}; 