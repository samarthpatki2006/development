import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Play, Pause, Square, SkipForward, SkipBack, Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import { Student } from './types';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import { cn } from "@/lib/utils";

interface RollCallInterfaceProps {
  students: Student[];
  currentIndex: number;
  isActive: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onCurrentIndexChange: (index: number) => void;
  speechPaused?: boolean;
  onSpeechResume?: () => void;
}

const RollCallInterface: React.FC<RollCallInterfaceProps> = ({
  students,
  currentIndex,
  isActive,
  onStart,
  onPause,
  onStop,
  onNext,
  onPrevious,
  onCurrentIndexChange,
  speechPaused = false,
  onSpeechResume
}) => {
  const {
    speak,
    stop: stopSpeech,
    pause: pauseSpeech,
    resume: resumeSpeech,
    isSupported,
    isSpeaking,
    isPaused,
    error: speechError
  } = useTextToSpeech();

  const [isRollCallActive, setIsRollCallActive] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);

  const currentStudent = students[currentIndex];

  // Handle speech completion and auto-advance
  const handleSpeechComplete = useCallback(() => {
    if (autoAdvance && isRollCallActive && currentIndex < students.length - 1) {
      // Auto-advance to next student after a brief pause
      setTimeout(() => {
        onNext();
      }, 1000);
    } else if (currentIndex >= students.length - 1) {
      // End of roll call
      setIsRollCallActive(false);
      onStop();
    }
  }, [autoAdvance, isRollCallActive, currentIndex, students.length, onNext, onStop]);

  // Speak current student name with enhanced synchronization
  const speakCurrentStudent = useCallback(async () => {
    if (!currentStudent || !isSupported || speechPaused) return;
    
    const studentName = `${currentStudent.first_name} ${currentStudent.last_name}`;
    try {
      await speak(studentName);
      if (!speechPaused) {
        handleSpeechComplete();
      }
    } catch (error) {
      console.error('Speech error:', error);
    }
  }, [currentStudent, isSupported, speak, handleSpeechComplete, speechPaused]);

  // Start roll call
  const handleStart = () => {
    if (!isSupported) return;
    
    setIsRollCallActive(true);
    onStart();
    speakCurrentStudent();
  };

  // Enhanced pause and resume handlers
  const handlePause = () => {
    if (isSpeaking && !isPaused) {
      pauseSpeech();
    }
    onPause();
  };

  // Resume roll call with speech synchronization
  const handleResume = () => {
    if (speechPaused && onSpeechResume) {
      onSpeechResume();
    }
    if (isPaused) {
      resumeSpeech();
    } else if (!isSpeaking && isRollCallActive && !speechPaused) {
      speakCurrentStudent();
    }
    onStart();
  };

  // Stop roll call
  const handleStop = () => {
    setIsRollCallActive(false);
    stopSpeech();
    onStop();
  };

  // Navigate to next student
  const handleNext = () => {
    if (currentIndex < students.length - 1) {
      stopSpeech();
      onNext();
      if (isRollCallActive) {
        setTimeout(() => speakCurrentStudent(), 500);
      }
    }
  };

  // Navigate to previous student
  const handlePrevious = () => {
    if (currentIndex > 0) {
      stopSpeech();
      onPrevious();
      if (isRollCallActive) {
        setTimeout(() => speakCurrentStudent(), 500);
      }
    }
  };

  // Effect to handle index changes from external sources with speech pause respect
  useEffect(() => {
    if (isRollCallActive && !isSpeaking && !isPaused && !speechPaused) {
      speakCurrentStudent();
    }
  }, [currentIndex, isRollCallActive, isSpeaking, isPaused, speechPaused, speakCurrentStudent]);

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <VolumeX className="h-5 w-5" />
            <span>Roll Call Interface</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="default" className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <div className="space-y-2">
                <p className="font-medium">Text-to-speech is not available in this browser.</p>
                <p className="text-sm">
                  You can still mark attendance manually using the buttons below each student's name. 
                  For the best experience, try using Chrome, Firefox, or Safari.
                </p>
              </div>
            </AlertDescription>
          </Alert>
          
          {/* Manual navigation controls for unsupported browsers */}
          {students.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Manual Navigation</h4>
              <div className="flex justify-center space-x-2">
                <Button
                  onClick={onPrevious}
                  disabled={currentIndex === 0}
                  variant="outline"
                  size="sm"
                >
                  <SkipBack className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm text-muted-foreground">
                  {currentIndex + 1} of {students.length}
                </span>
                <Button
                  onClick={onNext}
                  disabled={currentIndex >= students.length - 1}
                  variant="outline"
                  size="sm"
                >
                  Next
                  <SkipForward className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Volume2 className="h-5 w-5" />
          <span>Roll Call Interface</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {speechError && (
          <Alert variant="destructive">
            <VolumeX className="h-4 w-4" />
            <AlertDescription>{speechError}</AlertDescription>
          </Alert>
        )}

        {/* Current Student Display */}
        {currentStudent && (
          <div className={cn(
            "text-center p-4 rounded-lg transition-all duration-200",
            speechPaused ? "bg-yellow-50 border border-yellow-200" : "bg-muted"
          )}>
            <h3 className="text-lg font-semibold text-foreground">
              Current Student
            </h3>
            <p className="text-2xl font-bold text-primary mt-2">
              {currentStudent.first_name} {currentStudent.last_name}
            </p>
            <p className="text-sm text-muted-foreground">
              Roll Number: {currentStudent.roll_number}
            </p>
            <p className="text-sm text-muted-foreground">
              {currentIndex + 1} of {students.length}
            </p>
            {speechPaused && (
              <div className="mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium inline-flex items-center">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
                Speech Paused - Press Space or Resume
              </div>
            )}
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex justify-center space-x-2">
          {!isActive ? (
            <Button onClick={handleStart} disabled={students.length === 0}>
              <Play className="h-4 w-4 mr-2" />
              Start Roll Call
            </Button>
          ) : (
            <>
              {!isPaused ? (
                <Button onClick={handlePause} variant="secondary">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              ) : (
                <Button onClick={handleResume}>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              )}
              <Button onClick={handleStop} variant="destructive">
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="flex justify-center space-x-2">
          <Button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            variant="outline"
            size="sm"
          >
            <SkipBack className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={currentIndex >= students.length - 1}
            variant="outline"
            size="sm"
          >
            Next
            <SkipForward className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Status Indicators */}
        <div className="flex justify-center space-x-4 text-sm text-muted-foreground">
          <span className={`flex items-center ${isActive ? 'text-green-600' : ''}`}>
            Roll Call: {isActive ? 'Active' : 'Inactive'}
          </span>
          <span className={`flex items-center ${isSpeaking ? 'text-blue-600' : ''}`}>
            Speech: {isSpeaking ? (isPaused ? 'Paused' : 'Speaking') : 'Ready'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default RollCallInterface;