import { useEffect, useCallback, useState } from 'react';

export interface UseKeyboardShortcutsProps {
  onSpacePress: () => void;
  onEscapePress: () => void;
  isActive: boolean;
}

export interface UseKeyboardShortcutsReturn {
  isListening: boolean;
}

export const useKeyboardShortcuts = ({
  onSpacePress,
  onEscapePress,
  isActive
}: UseKeyboardShortcutsProps): UseKeyboardShortcutsReturn => {
  const [isListening, setIsListening] = useState(false);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Only handle shortcuts when active and not in input fields
    if (!isActive) return;
    
    const target = event.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || 
                        target.contentEditable === 'true' ||
                        (target.closest && target.closest('[contenteditable="true"]'));
    
    // Don't handle shortcuts when user is typing in input fields
    if (isInputField) return;

    switch (event.code) {
      case 'Space':
        event.preventDefault();
        event.stopPropagation();
        onSpacePress();
        break;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        onEscapePress();
        break;
      default:
        break;
    }
  }, [isActive, onSpacePress, onEscapePress]);

  useEffect(() => {
    if (isActive) {
      setIsListening(true);
      document.addEventListener('keydown', handleKeyDown, { capture: true });
    } else {
      setIsListening(false);
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    }

    // Cleanup on unmount
    return () => {
      setIsListening(false);
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [isActive, handleKeyDown]);

  return {
    isListening
  };
};