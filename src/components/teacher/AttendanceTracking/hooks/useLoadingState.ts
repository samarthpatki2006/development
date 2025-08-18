import { useState, useCallback } from 'react';
import { LoadingState } from '../types';

interface UseLoadingStateReturn {
  loadingState: LoadingState;
  setLoading: (isLoading: boolean, operation?: LoadingState['operation'], message?: string) => void;
  isLoading: boolean;
  loadingMessage: string;
}

export const useLoadingState = (): UseLoadingStateReturn => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false
  });

  const setLoading = useCallback((
    isLoading: boolean, 
    operation?: LoadingState['operation'], 
    message?: string
  ) => {
    setLoadingState({
      isLoading,
      operation,
      message
    });
  }, []);

  const getLoadingMessage = useCallback((): string => {
    if (!loadingState.isLoading) return '';
    
    if (loadingState.message) return loadingState.message;
    
    switch (loadingState.operation) {
      case 'fetching':
        return 'Loading students...';
      case 'saving':
        return 'Saving attendance...';
      case 'deleting':
        return 'Removing data...';
      case 'inserting':
        return 'Adding demo data...';
      default:
        return 'Processing...';
    }
  }, [loadingState]);

  return {
    loadingState,
    setLoading,
    isLoading: loadingState.isLoading,
    loadingMessage: getLoadingMessage()
  };
};