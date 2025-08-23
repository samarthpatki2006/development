import { useState, useCallback } from 'react';

interface MurfSpeechOptions {
  voiceId?: string;
  speed?: number;
  pitch?: number;
  format?: 'MP3' | 'WAV' | 'FLAC';
  model?: 'GEN1' | 'GEN2';
  style?: string;
}

interface MurfSpeechResponse {
  audioUrl?: string;
  error?: string;
}

export const useMurfSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

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
  ): Promise<void> => {
    if (!text.trim()) {
      throw new Error('No text provided');
    }

    setIsLoading(true);
    setError(null);

    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
    }

    try {
      const requestBody = {
        text: text,
        voiceId: options.voiceId || 'en-US-natalie', // Use proper Murf voice ID format
        speed: options.speed || 1.0,
        pitch: options.pitch || 0,
        format: options.format || 'MP3',
        model: options.model || 'GEN2', // Use GEN2 for better quality
        style: options.style || 'normal',
        channelType: 'MONO',
        sampleRate: 24000
      };

      console.log('Murf API Request:', {
        url: MURF_API_URL,
        body: requestBody,
        headers: {
          'Content-Type': 'application/json',
          'api-key': `${MURF_API_KEY.substring(0, 10)}...` // Log partial key for debugging
        }
      });

      const response = await fetch(MURF_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': MURF_API_KEY,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Murf API Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Murf API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use the text as is
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Murf API Response Data:', data);
      
      // Check if we have audioUrl in the response
      if (!data.audioFile && !data.audioUrl && !data.url) {
        console.error('Murf API Response missing audio URL:', data);
        throw new Error('No audio URL received from Murf API');
      }

      // Get the audio URL (different possible property names)
      const audioUrl = data.audioFile || data.audioUrl || data.url;
      
      // Create and play audio
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);
      
      audio.onloadstart = () => {
        console.log('Audio loading started');
      };
      
      audio.oncanplay = () => {
        console.log('Audio can start playing');
      };
      
      audio.onplay = () => {
        console.log('Audio started playing');
        setIsSpeaking(true);
      };
      
      audio.onended = () => {
        console.log('Audio playback ended');
        setIsSpeaking(false);
        setCurrentAudio(null);
      };
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setError('Audio playback failed');
        setIsSpeaking(false);
        setCurrentAudio(null);
        
        // Fallback to browser speech synthesis
        fallbackSpeak(text);
      };
      
      // Start playing the audio
      await audio.play();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Murf Speech Error:', errorMessage, err);
      setError(errorMessage);
      setIsSpeaking(false);
      
      // Fallback to browser speech synthesis
      console.log('Falling back to browser speech synthesis');
      const fallbackSuccess = fallbackSpeak(text);
      if (!fallbackSuccess) {
        throw new Error(`Speech failed: ${errorMessage}`);
      }
      
    } finally {
      setIsLoading(false);
    }
  }, [fallbackSpeak, currentAudio, MURF_API_KEY]);

  const stop = useCallback(() => {
    // Stop current Murf audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      setCurrentAudio(null);
    }
    
    // Stop browser speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    
    setIsSpeaking(false);
  }, [currentAudio]);

  const pause = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      setIsSpeaking(false);
    }
    
    // Pause browser speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthesis.pause();
      setIsSpeaking(false);
    }
  }, [currentAudio]);

  const resume = useCallback(() => {
    if (currentAudio) {
      currentAudio.play();
      setIsSpeaking(true);
    }
    
    // Resume browser speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthesis.resume();
      setIsSpeaking(true);
    }
  }, [currentAudio]);

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