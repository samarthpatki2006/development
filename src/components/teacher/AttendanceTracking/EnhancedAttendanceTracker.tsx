import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Calendar as CalendarIcon, Database, AlertCircle, 
  CalendarDays, Search, Filter, Download, Upload, Clock, 
  BarChart3, Volume2, VolumeX, Play, Pause, Square, 
  SkipForward, SkipBack, Mic, MicOff, UserCheck, UserX,
  TrendingUp, Settings, Eye, EyeOff, Sun, Moon,
  Zap, Target, Award, CheckCircle2, XCircle, AlertTriangle,
  Bell, BellOff, Camera, FileText, Share2, MessageSquare,
  Timer, RefreshCw, Save, History
} from 'lucide-react';
import { format, addDays, subDays, startOfWeek, endOfWeek, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from '@/hooks/use-toast';
import { useMurfSpeech } from './hooks/useMurfSpeech';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  roll_number: string;
  attendance_status: 'present' | 'absent' | 'pending';
  attendance_percentage: number;
  last_attendance_date?: string;
  notes?: string;
  photo_url?: string;
  total_classes?: number;
  present_count?: number;
  absent_count?: number;
  late_count?: number;
  consecutive_absences?: number;
  risk_level?: 'low' | 'medium' | 'high';
}

interface Course {
  id: string;
  name: string;
  code: string;
  total_students?: number;
  schedule?: {
    days: string[];
    start_time: string;
    end_time: string;
  };
}

interface AttendanceSession {
  id: string;
  course_id: string;
  class_date: string;
  start_time: string;
  end_time: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  attendance_percentage: number;
  weather?: string;
  notes?: string;
}

interface EnhancedAttendanceTrackerProps {
  teacherData: {
    user_id: string;
    first_name: string;
    last_name: string;
  };
}

const EnhancedAttendanceTracker: React.FC<EnhancedAttendanceTrackerProps> = ({ teacherData }) => {
  // Core State
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [attendanceVersion, setAttendanceVersion] = useState(0);
  
  // UI State
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'analytics' | 'calendar'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'absent' | 'pending' | 'at-risk'>('all');
  const [darkMode, setDarkMode] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [showPhotos, setShowPhotos] = useState(true);
  
  // Speech and Roll Call State
  const [isRollCallActive, setIsRollCallActive] = useState(false);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [speechPaused, setSpeechPaused] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechVolume, setSpeechVolume] = useState(1.0);
  const [autoAdvanceSpeed, setAutoAdvanceSpeed] = useState(2000);
  const [voiceIndex, setVoiceIndex] = useState(0);

  // Filter students based on search term and filter status
  const filteredStudents = students.filter(student => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
      student.roll_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'present' && student.attendance_status === 'present') ||
      (filterStatus === 'absent' && student.attendance_status === 'absent') ||
      (filterStatus === 'pending' && student.attendance_status === 'pending') ||
      (filterStatus === 'at-risk' && (student.risk_level === 'high' || student.attendance_percentage < 70 || student.consecutive_absences >= 3));
    
    return matchesSearch && matchesFilter;
  });
  
  // Enhanced Features State
  const [showRealTimeStats, setShowRealTimeStats] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [showNotifications, setShowNotifications] = useState(true);
  const [quickNotes, setQuickNotes] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [attendanceGoal, setAttendanceGoal] = useState(85);
  const [currentSession, setCurrentSession] = useState<AttendanceSession | null>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  
  // Use the Murf speech API instead of browser speech synthesis
  const {
    speak: speakText,
    stop: stopSpeech,
    pause: pauseSpeech,
    resume: resumeSpeech,
    isSpeaking,
    isLoading: speechLoading,
    error: speechError
  } = useMurfSpeech();
  
  // Debug logging for speech support
  useEffect(() => {
    console.log('Murf speech API initialized');
    if (speechError) {
      console.error('Murf speech error:', speechError);
    }
  }, [speechError]);
  
  // Refs
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpokenIndexRef = useRef(-1);
  
  const { toast } = useToast();

  // Mock data
  const [courses] = useState<Course[]>([
    { 
      id: '1', 
      name: 'Advanced React Development', 
      code: 'CS401',
      total_students: 25,
      schedule: { days: ['Mon', 'Wed', 'Fri'], start_time: '09:00', end_time: '10:30' }
    },
    { 
      id: '2', 
      name: 'Database Systems', 
      code: 'CS301',
      total_students: 30,
      schedule: { days: ['Tue', 'Thu'], start_time: '14:00', end_time: '15:30' }
    },
    { 
      id: '3', 
      name: 'Machine Learning', 
      code: 'CS501',
      total_students: 20,
      schedule: { days: ['Mon', 'Wed'], start_time: '11:00', end_time: '12:30' }
    }
  ]);

  // Initialize demo students when course is selected
  useEffect(() => {
    if (selectedCourse) {
      initializeDemoStudents();
    }
  }, [selectedCourse]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && students.length > 0) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveAttendanceData();
      }, 2000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [students, autoSave]);

  // Initialize demo students
  const initializeDemoStudents = () => {
    setLoading(true);
    setTimeout(() => {
      const demoStudents: Student[] = Array.from({ length: 25 }, (_, i) => ({
        id: `student-${i + 1}`,
        first_name: ['Aarav', 'Bhavna', 'Chirag', 'Divya', 'Eshan', 'Farah', 'Gaurav', 'Harini', 'Ishaan', 'Juhi',
             'Kunal', 'Lavanya', 'Manish', 'Neha', 'Omkar', 'Priya', 'Quasar', 'Riya', 'Sahil', 'Tanvi',
             'Uday', 'Vaishnavi', 'Waseem', 'Xenia', 'Yash'][i],

last_name: ['Agarwal', 'Bhat', 'Chowdhury', 'Desai', 'Elangovan', 'Fernandes', 'Gupta', 'Hariharan', 'Iyer', 'Jain',
            'Kapoor', 'Lal', 'Menon', 'Nair', 'Ojha', 'Patel', 'Qureshi', 'Reddy', 'Sharma', 'Tripathi',
            'Upadhyay', 'Varma', 'Wadhwa', 'Xavier', 'Yadav'][i],

        roll_number: `CS${String(i + 1).padStart(3, '0')}`,
        attendance_status: 'pending',
        attendance_percentage: Math.floor(Math.random() * 40) + 60, // 60-100%
        total_classes: 20,
        present_count: Math.floor(Math.random() * 8) + 12,
        absent_count: Math.floor(Math.random() * 5) + 1,
        late_count: Math.floor(Math.random() * 3),
        consecutive_absences: Math.floor(Math.random() * 3),
        risk_level: Math.random() > 0.8 ? 'high' : Math.random() > 0.6 ? 'medium' : 'low',
        photo_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 1}`,
        notes: Math.random() > 0.7 ? ['Excellent student', 'Needs improvement', 'Very active', 'Quiet but attentive'][Math.floor(Math.random() * 4)] : ''
      }));
      setStudents(demoStudents);
      setLoading(false);
      
      // Initialize session
      setCurrentSession({
        id: `session-${Date.now()}`,
        course_id: selectedCourse,
        class_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: format(new Date(), 'HH:mm'),
        end_time: '',
        total_students: demoStudents.length,
        present_count: 0,
        absent_count: 0,
        attendance_percentage: 0,
        notes: ''
      });
    }, 1000);
  };

  // Sound Effects (moved above markAttendance to avoid use-before-declare warnings)
  const playSound = useCallback((type: 'success' | 'warning' | 'info' | 'error') => {
    if (!soundEffects) return;

    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const frequencies = {
      success: [523.25, 659.25, 783.99], // C5, E5, G5
      warning: [493.88, 523.25], // B4, C5
      info: [440, 554.37], // A4, C#5
      error: [261.63, 196] // C4, G3
    } as const;

    const freq = frequencies[type];
    oscillator.frequency.setValueAtTime(freq[0], audioContext.currentTime);
    if (freq[1]) {
      oscillator.frequency.setValueAtTime(freq[1], audioContext.currentTime + 0.1);
    }
    if (freq[2]) {
      oscillator.frequency.setValueAtTime(freq[2], audioContext.currentTime + 0.2);
    }

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  }, [soundEffects]);

  // Attendance Functions
  const markAttendance = useCallback(async (studentId: string, status: 'present' | 'absent') => {
    setStudents(prev => {
      const updated = prev.map(student => 
        student.id === studentId 
          ? { 
              ...student, 
              attendance_status: status,
              last_attendance_date: format(selectedDate, 'yyyy-MM-dd')
            }
          : student
      );

      // Update real-time stats
      const presentCount = updated.filter(s => s.attendance_status === 'present').length;
      const absentCount = updated.filter(s => s.attendance_status === 'absent').length;
      const totalMarked = presentCount + absentCount;
      const percentage = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;

      // Update current session
      if (currentSession) {
        setCurrentSession(prev => prev ? {
          ...prev,
          present_count: presentCount,
          absent_count: absentCount,
          attendance_percentage: percentage
        } : null);
      }

      // Force re-render
      setAttendanceVersion(v => v + 1);

      // Show toast with sound effect
      const studentName = updated.find(s => s.id === studentId);
      if (studentName) {
        toast({
          title: `${studentName.first_name} ${studentName.last_name}`,
          description: `Marked as ${status}`,
          duration: 2000,
        });

        if (soundEffects) {
          playSound(status === 'present' ? 'success' : 'warning');
        }
        
        // Announce the action for accessibility
        speakText(`${studentName.first_name} ${studentName.last_name} marked as ${status}`).catch(error => {
          console.error('Speech error:', error);
        });
      }

      return updated;
    });
  }, [selectedDate, currentSession, toast, soundEffects, playSound, speakText]);

  // Enhanced Roll Call Functions (moved after filteredStudents declaration)
  const speakCurrentStudent = useCallback(async () => {
    if (!filteredStudents[currentStudentIndex] || speechPaused || !isRollCallActive) {
      console.log('Skipping speech because:', {
        noStudent: !filteredStudents[currentStudentIndex],
        speechPaused,
        notActive: !isRollCallActive,
        speechSupported: !speechLoading // Use speechLoading from useMurfSpeech
      });
      return;
    }
    
    const student = filteredStudents[currentStudentIndex];
    let announcement = `${student.first_name} ${student.last_name}`;
    
    // Add risk warning for at-risk students
    if (student.risk_level === 'high') {
      announcement += `. Attention: High risk student with ${student.attendance_percentage}% attendance`;
    } else if (student.consecutive_absences > 2) {
      announcement += `. Note: ${student.consecutive_absences} consecutive absences`;
    }
    
    console.log('Attempting to speak:', announcement);
    
    try {
      if (speechLoading) {
        console.warn('Murf speech is loading, using fallback audio');
        // Fallback to simple audio cue if speech synthesis isn't supported
        playSound('info');
      } else {
        await speakText(announcement);
      }
      
      // Auto-advance after speech completion if roll call is active
      if (isRollCallActive && !speechPaused) {
        setTimeout(() => {
          if (currentStudentIndex < filteredStudents.length - 1) {
            setCurrentStudentIndex(prev => prev + 1);
          } else {
            // End of roll call
            handleStopRollCall();
          }
        }, autoAdvanceSpeed);
      }
    } catch (error) {
      console.error('Speech error:', error);
      // Try fallback to beep sound
      playSound('warning');
      
      if (showNotifications) {
        toast({
          title: "Speech Synthesis Issue",
          description: "Using fallback audio instead of speech",
          variant: "destructive",
        });
      }
      
      // Continue roll call despite speech errors
      if (isRollCallActive && !speechPaused) {
        setTimeout(() => {
          if (currentStudentIndex < filteredStudents.length - 1) {
            setCurrentStudentIndex(prev => prev + 1);
          } else {
            // End of roll call
            handleStopRollCall();
          }
        }, autoAdvanceSpeed);
      }
    }
  }, [filteredStudents, currentStudentIndex, speechPaused, isRollCallActive, speechLoading, speakText, autoAdvanceSpeed, showNotifications, toast, playSound]);

  const handleStartRollCall = useCallback(async () => {
    if (filteredStudents.length === 0) {
      toast({
        title: 'No Students',
        description: 'No students available for roll call',
        variant: 'destructive',
      });
      return;
    }

    setIsRollCallActive(true);
    setCurrentStudentIndex(0);
    setSpeechPaused(false);
    
    // Initial announcement
    try {
      if (!speechLoading) {
        await speakText(`Starting roll call for ${filteredStudents.length} students. Press space to mark attendance.`);
        // Announce first student immediately
        if (filteredStudents[0]) {
          await speakText(`${filteredStudents[0].first_name} ${filteredStudents[0].last_name}`);
        }
      } else {
        // Fallback if speech synthesis is not supported
        console.warn('Murf speech is loading, skipping initial announcement');
        playSound('info');
      }
      // Start with first student after announcement
      setTimeout(() => {
        speakCurrentStudent();
      }, 1000);
    } catch (error) {
      console.error('Speech error:', error);
    }

    if (showNotifications) {
      toast({
        title: '📢 Roll Call Started',
        description: `Calling ${filteredStudents.length} students`,
        duration: 3000,
      });
    }
  }, [filteredStudents, speakText, speakCurrentStudent, showNotifications, toast, speechLoading, playSound]);

  const handleStopRollCall = useCallback(async () => {
    setIsRollCallActive(false);
    setSpeechPaused(false);
    setCurrentStudentIndex(0);
    stopSpeech();
    
    const presentCount = students.filter(s => s.attendance_status === 'present').length;
    const absentCount = students.filter(s => s.attendance_status === 'absent').length;
    
    try {
      await speakText(`Roll call completed. ${presentCount} students present, ${absentCount} students absent.`);
    } catch (error) {
      console.error('Speech error:', error);
    }
    
    if (showNotifications) {
      toast({
        title: '✅ Roll Call Complete',
        description: `${presentCount} present, ${absentCount} absent`,
        duration: 5000,
      });
    }
  }, [students, speakText, stopSpeech, showNotifications, toast]);

  // Effect to speak current student when index changes
  useEffect(() => {
    if (isRollCallActive && !speechPaused && currentStudentIndex !== lastSpokenIndexRef.current) {
      const timer = setTimeout(() => {
        speakCurrentStudent();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentStudentIndex, isRollCallActive, speechPaused, speakCurrentStudent]);

  // Enhanced Keyboard Shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Don't handle shortcuts if user is typing in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          if (isRollCallActive) {
            setShowAttendanceModal(true);
          }
          break;
        case 'KeyP':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            if (currentStudentIndex < filteredStudents.length && filteredStudents[currentStudentIndex]) {
              markAttendance(filteredStudents[currentStudentIndex].id, 'present');
              if (isRollCallActive && currentStudentIndex < filteredStudents.length - 1) {
                setCurrentStudentIndex(prev => prev + 1);
              }
            }
          }
          break;
        case 'KeyA':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            if (currentStudentIndex < filteredStudents.length && filteredStudents[currentStudentIndex]) {
              markAttendance(filteredStudents[currentStudentIndex].id, 'absent');
              if (isRollCallActive && currentStudentIndex < filteredStudents.length - 1) {
                setCurrentStudentIndex(prev => prev + 1);
              }
            }
          }
          break;
        case 'Escape':
          if (isRollCallActive) {
            event.preventDefault();
            handleStopRollCall();
          }
          break;
        case 'ArrowRight':
          if (isRollCallActive && currentStudentIndex < filteredStudents.length - 1) {
            event.preventDefault();
            stopSpeech();
            setCurrentStudentIndex(prev => prev + 1);
          }
          break;
        case 'ArrowLeft':
          if (isRollCallActive && currentStudentIndex > 0) {
            event.preventDefault();
            stopSpeech();
            setCurrentStudentIndex(prev => prev - 1);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRollCallActive, speechPaused, currentStudentIndex, filteredStudents, markAttendance, resumeSpeech, pauseSpeech, stopSpeech, speakCurrentStudent, handleStopRollCall]);

  // Calculate Statistics
  const calculateStats = useCallback(() => {
    const total = students.length;
    const present = students.filter(s => s.attendance_status === 'present').length;
    const absent = students.filter(s => s.attendance_status === 'absent').length;
    const pending = students.filter(s => s.attendance_status === 'pending').length;
    const marked = present + absent;
    const percentage = marked > 0 ? Math.round((present / marked) * 100) : 0;
    const averageAttendance = total > 0 ? Math.round(students.reduce((sum, s) => sum + s.attendance_percentage, 0) / total) : 0;
    const atRiskStudents = students.filter(s => s.attendance_percentage < 70 || s.consecutive_absences >= 3).length;

    return {
      total,
      present,
      absent,
      pending,
      marked,
      percentage,
      averageAttendance,
      atRiskStudents,
      goalMet: percentage >= attendanceGoal
    };
  }, [students, attendanceGoal]);

  const stats = calculateStats();

  // Save attendance data
  const saveAttendanceData = useCallback(() => {
    // In a real app, this would save to database
    localStorage.setItem(`attendance-${selectedCourse}-${format(selectedDate, 'yyyy-MM-dd')}`, JSON.stringify({
      students,
      session: currentSession,
      notes: sessionNotes,
      timestamp: new Date().toISOString()
    }));

    if (showNotifications) {
      toast({
        title: 'Attendance Saved',
        description: 'Data has been automatically saved',
        duration: 2000,
      });
    }
  }, [selectedCourse, selectedDate, students, currentSession, sessionNotes, showNotifications, toast]);

  // Export functions
  const exportAttendance = useCallback((exportFormat: 'csv' | 'pdf' | 'excel') => {
    const data = students.map(student => ({
      'Roll Number': student.roll_number,
      'Name': `${student.first_name} ${student.last_name}`,
      'Status': student.attendance_status,
      'Attendance %': student.attendance_percentage,
      'Notes': student.notes || ''
    }));

    // Create CSV
    if (exportFormat === 'csv') {
      const csv = [
        Object.keys(data[0]).join(','),
        ...data.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${selectedCourse}-${format(selectedDate, 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }

    toast({
      title: 'Export Complete',
      description: `Attendance data exported as ${exportFormat.toUpperCase()}`,
    });
  }, [students, selectedCourse, selectedDate, toast]);

  return (
    <div className={cn("space-y-6 transition-all duration-300", darkMode && "dark")}>
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r bg-clip-text">
            Enhanced Attendance Tracker
          </h1>
          <p className="text-muted-foreground mt-1">
            Intelligent attendance management with speech recognition and real-time analytics
          </p>
        </div>
      </div>

      {/* Course and Date Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Select Course</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{course.code} - {course.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {course.total_students} students
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>Class Date</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>
      </div>

      {selectedCourse && (
        <>
          {/* Real-time Statistics Dashboard */}
          {showRealTimeStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className={cn("transition-all duration-300", stats.goalMet && "ring-2 ring-green-500")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Rate</CardTitle>
                  <TrendingUp className={cn("h-4 w-4", stats.percentage >= attendanceGoal ? "text-green-600" : "text-yellow-600")} />
                </CardHeader>
                <CardContent>
                  <div className={cn("text-2xl font-bold", stats.percentage >= attendanceGoal ? "text-green-600" : "text-yellow-600")}>
                    {stats.percentage}%
                  </div>
                  <Progress value={stats.percentage} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Goal: {attendanceGoal}% {stats.goalMet && "✅"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Present</CardTitle>
                  <UserCheck className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.pending} pending
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Absent</CardTitle>
                  <UserX className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((stats.absent / stats.total) * 100)}% of class
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">At Risk</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.atRiskStudents}</div>
                  <p className="text-xs text-muted-foreground">
                    Need attention
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Enhanced Control Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Control Panel</span>
                </div>
                <div className="flex items-center space-x-2">
                  {isRollCallActive && (
                    <Badge variant="default" className="animate-pulse">
                      Roll Call Active
                    </Badge>
                  )}
                  {speechPaused && (
                    <Badge variant="secondary">
                      Speech Paused
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="space-y-2">
                  <Label>Search Students</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Name or roll number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                {/* Filter */}
                <div className="space-y-2">
                  <Label>Filter Students</Label>
                  <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                    <SelectTrigger>
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Students</SelectItem>
                      <SelectItem value="present">Present Only</SelectItem>
                      <SelectItem value="absent">Absent Only</SelectItem>
                      <SelectItem value="pending">Pending Only</SelectItem>
                      <SelectItem value="at-risk">At Risk Students</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* View Mode */}
                <div className="space-y-2">
                  <Label>View Mode</Label>
                  <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="list">List View</SelectItem>
                      <SelectItem value="grid">Grid View</SelectItem>
                      <SelectItem value="analytics">Analytics</SelectItem>
                      <SelectItem value="calendar">Calendar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Speech Controls */}
                <div className="space-y-2">
                  <Label>Speech Control</Label>
                  <div className="flex space-x-1">
                    <Button
                      variant={speechEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSpeechEnabled(!speechEnabled)}
                    >
                      {speechEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSpeechPaused(!speechPaused)}
                      disabled={!isRollCallActive}
                    >
                      {speechPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Advanced Controls */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 pt-4 border-t">
                <Button onClick={handleStartRollCall} disabled={isRollCallActive || filteredStudents.length === 0}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Roll Call
                </Button>
                {isRollCallActive && (
                  <>
                    <Button onClick={speechPaused ? resumeSpeech : pauseSpeech} variant="secondary">
                      {speechPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                      {speechPaused ? 'Resume' : 'Pause'}
                    </Button>
                    <Button onClick={handleStopRollCall} variant="destructive">
                      <Square className="h-4 w-4 mr-2" />
                      Stop Roll Call
                    </Button>
                  </>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => {
                    filteredStudents.forEach(student => {
                      if (student.attendance_status === 'pending') {
                        markAttendance(student.id, 'present');
                      }
                    });
                  }}
                  disabled={stats.pending === 0}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark All Present
                </Button>
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    // Test speech by reading all student names
                    const names = filteredStudents.map(s => `${s.first_name} ${s.last_name}`).join(', ');
                    try {
                      await speakText(`Today's students: ${names}`);
                    } catch (error) {
                      console.error('Speech error:', error);
                    }
                  }}
                  disabled={filteredStudents.length === 0}
                  className="w-full"
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  Announce All Names
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => exportAttendance('csv')}
                  disabled={students.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button 
                  variant="outline" 
                  onClick={saveAttendanceData}
                  disabled={students.length === 0}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Speech Settings */}
          {speechEnabled && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mic className="h-5 w-5" />
                  <span>Speech Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Speech Rate: {speechRate.toFixed(1)}x</Label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={speechRate}
                      onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Volume: {Math.round(speechVolume * 100)}%</Label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={speechVolume}
                      onChange={(e) => setSpeechVolume(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Auto-advance: {autoAdvanceSpeed}ms</Label>
                    <input
                      type="range"
                      min="1000"
                      max="5000"
                      step="500"
                      value={autoAdvanceSpeed}
                      onChange={(e) => setAutoAdvanceSpeed(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    onClick={async () => {
                      try {
                        await speakText("Text to speech is working correctly. You can now start roll call.");
                      } catch (error) {
                        console.error('Speech error:', error);
                      }
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    Test Speech
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <Card>
              <CardContent className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading students...</p>
              </CardContent>
            </Card>
          )}

          {/* Main Content Tabs */}
          {!loading && filteredStudents.length > 0 && (
            <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="list">List View</TabsTrigger>
                <TabsTrigger value="grid">Grid View</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="space-y-4">
                {/* Roll Call Interface */}
                {isRollCallActive && (
                  <Card className="border-2 border-black bg-white shadow-lg">
                    <CardHeader className="bg-gray-100 border-b-2 border-black">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Volume2 className="h-5 w-5 text-black" />
                          <span className="text-black font-bold">Roll Call Active</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="border-black text-black bg-white">
                            {currentStudentIndex + 1} of {filteredStudents.length}
                          </Badge>
                          {speechPaused && (
                            <Badge variant="secondary" className=" border border-black">
                              Paused - Press Space to Resume
                            </Badge>
                          )}
                          {!speechLoading && ( // Use speechLoading from useMurfSpeech
                            <Badge variant="outline" className="border-red-500 text-red-700 bg-white">
                              Speech Disabled
                            </Badge>
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {filteredStudents[currentStudentIndex] && (
                        <div className="text-center space-y-6">
                          <div className="flex items-center justify-center space-x-6">
                            {showPhotos && (
                              <img
                                src={filteredStudents[currentStudentIndex].photo_url}
                                alt="Student"
                                className="w-20 h-20 rounded-full border-2 border-black shadow-lg"
                              />
                            )}
                            <div>
                              <h3 className="text-3xl font-bold text-black mb-2">
                                {filteredStudents[currentStudentIndex].first_name} {filteredStudents[currentStudentIndex].last_name}
                              </h3>
                              <p className="text-lg text-gray-600">
                                {filteredStudents[currentStudentIndex].roll_number}
                              </p>
                            </div>
                          </div>
                          <div className="flex justify-center space-x-6">
                            <Button
                              size="lg"
                              onClick={() => {
                                markAttendance(filteredStudents[currentStudentIndex].id, 'present');
                                if (currentStudentIndex < filteredStudents.length - 1) {
                                  setCurrentStudentIndex(prev => prev + 1);
                                }
                              }}
                              className="bg-black hover:bg-gray-800 text-white px-8 py-3 text-lg font-semibold shadow-lg"
                            >
                              <CheckCircle2 className="h-6 w-6 mr-3" />
                              Present (Ctrl+P)
                            </Button>
                            <Button
                              size="lg"
                              variant="outline"
                              onClick={() => {
                                markAttendance(filteredStudents[currentStudentIndex].id, 'absent');
                                if (currentStudentIndex < filteredStudents.length - 1) {
                                  setCurrentStudentIndex(prev => prev + 1);
                                }
                              }}
                              className="border-2 border-black text-black hover:bg-gray-100 px-8 py-3 text-lg font-semibold shadow-lg"
                            >
                              <XCircle className="h-6 w-6 mr-3" />
                              Absent (Ctrl+A)
                            </Button>
                          </div>
                          <div className="flex justify-center space-x-4">
                            <Button
                              variant="outline"
                              size="lg"
                              onClick={() => {
                                if (currentStudentIndex > 0) {
                                  stopSpeech();
                                  setCurrentStudentIndex(prev => prev - 1);
                                }
                              }}
                              disabled={currentStudentIndex === 0}
                              className="border-2 border-black text-black hover:bg-gray-100"
                            >
                              <SkipBack className="h-5 w-5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="lg"
                              onClick={() => {
                                if (speechPaused) {
                                  resumeSpeech();
                                  setTimeout(() => speakCurrentStudent(), 100);
                                } else {
                                  pauseSpeech();
                                }
                              }}
                              className="border-2 border-black text-black hover:bg-gray-100"
                            >
                              {speechPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="lg"
                              onClick={() => {
                                if (currentStudentIndex < filteredStudents.length - 1) {
                                  stopSpeech();
                                  setCurrentStudentIndex(prev => prev + 1);
                                }
                              }}
                              disabled={currentStudentIndex >= filteredStudents.length - 1}
                              className="border-2 border-black text-black"
                            >
                              <SkipForward className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Students List */}
                <Card className="border-2 border-black shadow-lg">
                  <CardHeader className="border-b-2 border-black">
                    <CardTitle className="font-bold text-xl">Students ({filteredStudents.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {filteredStudents.map((student, index) => (
                        <div
                          key={student.id}
                          className={cn(
                            "flex items-center justify-between p-6 border-2 rounded-lg transition-all duration-200 cursor-pointer border-black min-h-[80px]",
                            currentStudentIndex === index && isRollCallActive && "ring-4 ring-black shadow-xl",
                            student.attendance_status === 'present' && "border-green-600",
                            student.attendance_status === 'absent' && "border-red-600 ",
                            student.attendance_status === 'pending' && "border-black ",
                            student.risk_level === 'high' && "border-l-8 border-l-red-600",
                            student.risk_level === 'medium' && "border-l-8 border-l-orange-500",
                            student.risk_level === 'low' && "border-l-4 border-l-green-400"
                          )}
                          onClick={() => {
                            if (isRollCallActive) {
                              setCurrentStudentIndex(index);
                            }
                          }}
                        >
                          <div className="flex items-center space-x-6">
                            {showPhotos && (
                              <img
                                src={student.photo_url}
                                alt={`${student.first_name} ${student.last_name}`}
                                className="w-16 h-16 rounded-full border-2 border-white shadow-md"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-lg mb-1">
                                {student.first_name} {student.last_name}
                              </p>
                              <p className="text-base mb-2">
                                {student.roll_number} • {student.attendance_percentage}% attendance
                              </p>
                              {student.notes && (
                                <p className="text-sm italic">{student.notes}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            {student.risk_level === 'high' && (
                              <Badge variant="destructive" className="text-sm border-2 border-red-600 px-3 py-1">
                                🚨 High Risk
                              </Badge>
                            )}
                            {student.risk_level === 'medium' && (
                              <Badge variant="secondary" className="text-sm border-2 border-orange-500 px-3 py-1">
                                ⚠️ At Risk
                              </Badge>
                            )}
                            <Badge 
                              variant={
                                student.attendance_status === 'present' ? 'default' :
                                student.attendance_status === 'absent' ? 'destructive' : 'secondary'
                              }
                              className={cn(
                                "text-sm px-4 py-2 font-semibold",
                                student.attendance_status === 'present' && "text-green-800 border-2 border-green-600",
                                student.attendance_status === 'absent' && "text-red-800 border-2 border-red-600",
                                student.attendance_status === 'pending' && "text-yellow-800 border-2 border-yellow-600"
                              )}
                            >
                              {student.attendance_status === 'present' && '✅ Present'}
                              {student.attendance_status === 'absent' && '❌ Absent'}
                              {student.attendance_status === 'pending' && '⏳ Pending'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const announcement = student.risk_level === 'high' ? 
                                  `${student.first_name} ${student.last_name}. High risk student with ${student.attendance_percentage}% attendance.` :
                                  `${student.first_name} ${student.last_name}`;
                                try {
                                  await speakText(announcement);
                                } catch (error) {
                                  console.error('Speech error:', error);
                                }
                              }}
                              className="h-8 w-8 p-0 border border-black"
                            >
                              <Volume2 className="h-4 w-4" />
                            </Button>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant={student.attendance_status === 'present' ? 'default' : 'outline'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAttendance(student.id, 'present');
                                }}
                                className={cn(
                                  "transition-all duration-200 px-4 py-2 font-semibold",
                                  student.attendance_status === 'present' && " hover:bg-green-700 shadow-md border-2 border-green-600",
                                  student.attendance_status !== 'present' && "border-2"
                                )}
                              >
                                <CheckCircle2 className="h-5 w-5 mr-1" />
                                Present
                              </Button>
                              <Button
                                size="sm"
                                variant={student.attendance_status === 'absent' ? 'destructive' : 'outline'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAttendance(student.id, 'absent');
                                }}
                                className={cn(
                                  "transition-all duration-200 px-4 py-2 font-semibold",
                                  student.attendance_status === 'absent' && " hover:bg-red-700 shadow-md border-2",
                                  student.attendance_status !== 'absent' && "border-2 "
                                )}
                              >
                                <XCircle className="h-5 w-5 mr-1" />
                                Absent
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="grid" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredStudents.map((student, index) => (
                    <Card 
                      key={student.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105",
                        currentStudentIndex === index && isRollCallActive && "ring-2 shadow-xl",
                        student.attendance_status === 'present',
                        student.attendance_status === 'absent' ,
                        student.attendance_status === 'pending',
                        student.risk_level === 'high',
                        student.risk_level === 'medium'
                      )}
                    >
                      <CardContent className="p-4 text-center">
                        <img
                          src={student.photo_url}
                          alt={`${student.first_name} ${student.last_name}`}
                          className={cn(
                            "w-16 h-16 rounded-full mx-auto mb-2 border-2 transition-all duration-200",
                            student.attendance_status === 'present' ,
                            student.attendance_status === 'absent' ,
                            student.attendance_status === 'pending',
                            student.risk_level === 'high'
                          )}
                        />
                        <p className="font-medium text-sm">{student.first_name}</p>
                        <p className="font-medium text-sm">{student.last_name}</p>
                        <p className="text-xs text-muted-foreground">{student.roll_number}</p>
                        <p className={cn(
                          "text-xs font-semibold",
                          student.attendance_percentage >= 85 && "text-green-600",
                          student.attendance_percentage >= 70 && student.attendance_percentage < 85 && "text-yellow-600",
                          student.attendance_percentage < 70 && "text-red-600"
                        )}>
                          {student.attendance_percentage}%
                        </p>
                        {student.risk_level === 'high' && (
                          <Badge variant="destructive" className="text-xs mt-1">🚨</Badge>
                        )}
                        {student.risk_level === 'medium' && (
                          <Badge variant="secondary" className="text-xs mt-1 ">⚠️</Badge>
                        )}
                        <div className="flex justify-center space-x-1 mt-2">
                          <Button
                            size="sm"
                            variant={student.attendance_status === 'present' ? 'default' : 'outline'}
                            onClick={() => markAttendance(student.id, 'present')}
                            className={cn(
                              "h-6 px-2 text-xs transition-all duration-200",
                              student.attendance_status === 'present' && " shadow-md"
                            )}
                          >
                            ✅
                          </Button>
                          <Button
                            size="sm"
                            variant={student.attendance_status === 'absent' ? 'destructive' : 'outline'}
                            onClick={() => markAttendance(student.id, 'absent')}
                            className={cn(
                              "h-6 px-2 text-xs transition-all duration-200",
                              student.attendance_status === 'absent' && "bg-red-600 hover:bg-red- shadow-md"
                            )}
                          >
                            ❌
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                {/* At-Risk Students Alert */}
                {stats.atRiskStudents > 0 && (
                  <Alert className="border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>{stats.atRiskStudents} students</strong> are at risk due to low attendance (&lt;70%) or consecutive absences. 
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-red-600 underline ml-1"
                        onClick={() => setFilterStatus('at-risk')}
                      >
                        View these students
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Attendance Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                            Present
                          </span>
                          <span className="font-semibold text-green-600">{stats.present}</span>
                        </div>
                        <Progress value={(stats.present / stats.total) * 100} className="h-2" />
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                            Absent
                          </span>
                          <span className="font-semibold text-red-600">{stats.absent}</span>
                        </div>
                        <Progress value={(stats.absent / stats.total) * 100} className="h-2" />
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm flex items-center">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                            Pending
                          </span>
                          <span className="font-semibold text-yellow-600">{stats.pending}</span>
                        </div>
                        <Progress value={(stats.pending / stats.total) * 100} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className={cn("text-3xl font-bold", 
                            stats.averageAttendance >= 85 ? "text-green-600" : 
                            stats.averageAttendance >= 70 ? "text-yellow-600" : "text-red-600"
                          )}>
                            {stats.averageAttendance}%
                          </div>
                          <p className="text-sm text-muted-foreground">Average Attendance</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{stats.atRiskStudents}</div>
                          <p className="text-sm text-muted-foreground">Students at Risk</p>
                        </div>
                        <div className="text-center">
                          <div className={cn("text-2xl font-bold", stats.goalMet ? "text-green-600" : "text-red-600")}>
                            {stats.goalMet ? "🎯" : "📈"}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Goal {stats.goalMet ? "Met" : "Not Met"} ({attendanceGoal}%)
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Button 
                          onClick={() => exportAttendance('csv')} 
                          className="w-full" 
                          variant="outline"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export Report
                        </Button>
                        <Button 
                          onClick={async () => {
                            setFilterStatus('at-risk');
                            setViewMode('list');
                            if (stats.atRiskStudents > 0) {
                              await speakText(`Found ${stats.atRiskStudents} students at risk. Switching to at-risk view.`);
                            }
                          }} 
                          className="w-full" 
                          variant="outline"
                          disabled={stats.atRiskStudents === 0}
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          View At-Risk Students ({stats.atRiskStudents})
                        </Button>
                        <Button 
                          onClick={async () => {
                            // Speak summary of at-risk students
                            const atRiskStudents = filteredStudents.filter(s => s.risk_level === 'high' || s.attendance_percentage < 70);
                            if (atRiskStudents.length > 0) {
                              const names = atRiskStudents.slice(0, 3).map(s => `${s.first_name} ${s.last_name}`).join(', ');
                              const summary = `${atRiskStudents.length} students at risk: ${names}${atRiskStudents.length > 3 ? ' and others' : ''}`;
                              await speakText(summary);
                            } else {
                              await speakText('No students are currently at risk. Great job!');
                            }
                          }} 
                          className="w-full" 
                          variant="outline"
                        >
                          <Volume2 className="h-4 w-4 mr-2" />
                          Announce At-Risk
                        </Button>
                        <Button 
                          onClick={saveAttendanceData} 
                          className="w-full" 
                          variant="outline"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Session
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* At-Risk Students Detailed View */}
                {filterStatus === 'at-risk' && filteredStudents.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5" />
                        <span>Students Requiring Attention ({filteredStudents.length})</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {filteredStudents.map((student) => (
                          <div key={student.id} className="p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={student.photo_url}
                                  alt={`${student.first_name} ${student.last_name}`}
                                  className="w-10 h-10 rounded-full border-2 border-red-400"
                                />
                                <div>
                                  <p className="font-medium ">
                                    {student.first_name} {student.last_name}
                                  </p>
                                  <p className="text-sm ">
                                    {student.roll_number} • {student.attendance_percentage}% attendance
                                  </p>
                                  {student.consecutive_absences > 0 && (
                                    <p className="text-xs">
                                      {student.consecutive_absences} consecutive absences
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="destructive">
                                  {student.risk_level === 'high' ? '🚨 Critical' : '⚠️ At Risk'}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    const message = `${student.first_name} ${student.last_name} has ${student.attendance_percentage}% attendance and ${student.consecutive_absences} consecutive absences. Consider reaching out to discuss attendance.`;
                                    await speakText(message);
                                  }}
                                >
                                  <Volume2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Session Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Session Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Add notes about today's class, at-risk students, or general observations..."
                      value={sessionNotes}
                      onChange={(e) => setSessionNotes(e.target.value)}
                      rows={4}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="calendar" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Attendance View</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium">Calendar View</p>
                      <p className="text-muted-foreground">
                        Weekly and monthly attendance patterns coming soon
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Quick Help */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Keyboard Shortcuts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Space:</strong> Pause/Resume speech during roll call
                </div>
                <div>
                  <strong>Ctrl+P:</strong> Mark current student as Present
                </div>
                <div>
                  <strong>Ctrl+A:</strong> Mark current student as Absent
                </div>
                <div>
                  <strong>Escape:</strong> Stop roll call
                </div>
                <div>
                  <strong>Arrow Keys:</strong> Navigate through students
                </div>
                <div>
                  <strong>Auto-save:</strong> Data saved every 2 seconds
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Attendance Selection Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50">
          <div className=" rounded-lg shadow-xl p-8 w-96 text-center border-2 border-black">
            <h2 className="text-2xl font-bold mb-4">Mark Attendance</h2>
            <div className="mb-6">
              <img
                src={filteredStudents[currentStudentIndex]?.photo_url}
                alt="Student"
                className="w-16 h-16 rounded-full border-2 border-black mx-auto mb-3"
              />
              <p className="text-xl font-semibold text-black">
                {filteredStudents[currentStudentIndex]?.first_name} {filteredStudents[currentStudentIndex]?.last_name}
              </p>
              <p className="text-gray-600">
                {filteredStudents[currentStudentIndex]?.roll_number}
              </p>
            </div>
            <div className="flex justify-center gap-4 mb-4">
              <Button
                className="px-8 py-3 text-lg font-semibold shadow-lg"
                onClick={() => {
                  markAttendance(filteredStudents[currentStudentIndex].id, 'present');
                  setShowAttendanceModal(false);
                  if (currentStudentIndex < filteredStudents.length - 1) {
                    setCurrentStudentIndex(prev => prev + 1);
                  }
                }}
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Present
              </Button>
              <Button
                className="border-2 border-black px-8 py-3 text-lg font-semibold shadow-lg"
                onClick={() => {
                  markAttendance(filteredStudents[currentStudentIndex].id, 'absent');
                  setShowAttendanceModal(false);
                  if (currentStudentIndex < filteredStudents.length - 1) {
                    setCurrentStudentIndex(prev => prev + 1);
                  }
                }}
              >
                <XCircle className="h-5 w-5 mr-2" />
                Absent
              </Button>
            </div>
            <Button
              variant="ghost"
              className="text-gray-500 hover:text-black border border-gray-300 hover:border-black"
              onClick={() => setShowAttendanceModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAttendanceTracker;
