import React, { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UserX, UserCheck, Clock } from 'lucide-react';

export interface AttendanceConfirmDialogProps {
  isOpen: boolean;
  studentName: string;
  onConfirm: () => void;
  onCancel: () => void;
  autoCloseTimer?: number; // in seconds, defaults to 10
}

const AttendanceConfirmDialog: React.FC<AttendanceConfirmDialogProps> = ({
  isOpen,
  studentName,
  onConfirm,
  onCancel,
  autoCloseTimer = 10
}) => {
  const [timeLeft, setTimeLeft] = useState(autoCloseTimer);
  const [progress, setProgress] = useState(100);

  // Reset timer when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(autoCloseTimer);
      setProgress(100);
    }
  }, [isOpen, autoCloseTimer]);

  // Handle countdown timer
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 0.1;
        if (newTime <= 0) {
          // Auto-mark as present when timer expires
          onCancel();
          return 0;
        }
        return newTime;
      });

      setProgress((prev) => {
        const newProgress = (timeLeft / autoCloseTimer) * 100;
        return Math.max(0, newProgress);
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft, autoCloseTimer, onCancel]);

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onCancel();
    }
  };

  // Handle keyboard shortcuts within the dialog
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;

    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        event.stopPropagation();
        handleConfirm();
        break;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        handleCancel();
        break;
      default:
        break;
    }
  }, [isOpen, handleConfirm, handleCancel]);

  // Add keyboard event listeners for the dialog
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown, { capture: true });
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [isOpen, handleKeyDown]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-md"
        aria-describedby="attendance-confirm-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserX className="h-5 w-5 text-destructive" />
            <span>Mark Student Absent?</span>
          </DialogTitle>
          <DialogDescription id="attendance-confirm-description">
            Do you want to mark <strong>{studentName}</strong> as absent?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Timer Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>Auto-close in {Math.ceil(timeLeft)}s</span>
              </span>
              <span className="text-muted-foreground">
                Will mark as present if no action taken
              </span>
            </div>
            <div 
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Auto-close timer: ${Math.ceil(timeLeft)} seconds remaining`}
              className="h-2 bg-muted rounded-full overflow-hidden"
            >
              <div 
                className="h-full bg-primary transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              onClick={handleConfirm}
              className="flex items-center space-x-2"
              autoFocus
            >
              <UserX className="h-4 w-4" />
              <span>Mark Absent</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex items-center space-x-2"
            >
              <UserCheck className="h-4 w-4" />
              <span>Mark Present</span>
            </Button>
          </DialogFooter>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="text-xs text-muted-foreground text-center border-t pt-3">
          <p>
            Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to mark absent, 
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-1">Esc</kbd> to mark present
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceConfirmDialog;