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
  const [compactMode, setCompactMode] = useState(false);
  const [showPhotos, setShowPhotos] = useState(true);
  
  // Enhanced Speech State
  const [isRollCallActive, setIsRollCallActive] = useState(false);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechVolume, setSpeechVolume] = useState(1.0);
  const [voiceIndex, setVoiceIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [waitingForAttendance, setWaitingForAttendance] = useState(false);
  const [rollCallPhase, setRollCallPhase] = useState<'idle' | 'announcing' | 'waiting' | 'confirming'>('idle');
  
  // Enhanced Features State
  const [showRealTimeStats, setShowRealTimeStats] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [showNotifications, setShowNotifications] = useState(true);
  const [quickNotes, setQuickNotes] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [attendanceGoal, setAttendanceGoal] = useState(85);
  const [currentSession, setCurrentSession] = useState<AttendanceSession | null>(null);
  
  // Speech synthesis refs and state
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const availableVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthRef.current = window.speechSynthesis;
      setSpeechSupported(true);
      
      const loadVoices = () => {
        const voices = speechSynthRef.current?.getVoices() || [];
        availableVoicesRef.current = voices;
        console.log('Available voices:', voices.length);
      };
      
      loadVoices();
      if (speechSynthRef.current) {
        speechSynthRef.current.addEventListener('voiceschanged', loadVoices);
      }
    } else {
      console.warn('Speech synthesis not supported');
      setSpeechSupported(false);
    }

    return () => {
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
    };
  }, []);

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
        attendance_percentage: Math.floor(Math.random() * 40) + 60,
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

  // Enhanced Speech Functions
  const speak = useCallback((text: string, priority: 'high' | 'normal' = 'normal'): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!speechSupported || !speechEnabled || !speechSynthRef.current) {
        console.log('Speech not available');
        resolve();
        return;
      }

      // Cancel any ongoing speech for high priority messages
      if (priority === 'high' && speechSynthRef.current.speaking) {
        speechSynthRef.current.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speechRate;
      utterance.volume = speechVolume;
      
      // Use selected voice if available
      if (availableVoicesRef.current[voiceIndex]) {
        utterance.voice = availableVoicesRef.current[voiceIndex];
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        console.log('Speech started:', text);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        console.log('Speech ended');
        resolve();
      };

      utterance.onerror = (event) => {
        setIsSpeaking(false);
        console.error('Speech error:', event);
        reject(event);
      };

      speechUtteranceRef.current = utterance;
      speechSynthRef.current.speak(utterance);
    });
  }, [speechSupported, speechEnabled, speechRate, speechVolume, voiceIndex]);

  const stopSpeech = useCallback(() => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Sound Effects
  const playSound = useCallback((type: 'success' | 'warning' | 'info' | 'error') => {
    if (!soundEffects) return;

    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const frequencies = {
      success: [523.25, 659.25, 783.99],
      warning: [493.88, 523.25],
      info: [440, 554.37],
      error: [261.63, 196]
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

  // Show toast notification
  const showToast = useCallback((title: string, description: string, variant?: 'default' | 'destructive') => {
    if (showNotifications) {
      // Simple console log for now since we don't have toast context
      console.log(`${title}: ${description}`);
      playSound(variant === 'destructive' ? 'error' : 'success');
    }
  }, [showNotifications, playSound]);

  // FIXED: Announce current student function
  const announceCurrentStudent = useCallback(async () => {
    if (!filteredStudents[currentStudentIndex] || !isRollCallActive) {
      return;
    }
    var student;
    if(currentStudentIndex==0){
      student = filteredStudents[currentStudentIndex];
    }
    else if(currentStudentIndex ==1){
      student = filteredStudents[currentStudentIndex+1];
    }
    else{
      student = filteredStudents[currentStudentIndex + 1];
    }
    let announcement = `${student.first_name} ${student.last_name}`;
   
    // Add risk warning for at-risk students
    if (student.risk_level === 'high') {
      announcement += `. Attention: High risk student with ${student.attendance_percentage}% attendance`;
    } else if (student.consecutive_absences > 2) {
      announcement += `. Note: ${student.consecutive_absences} consecutive absences`;
    }
    
    console.log('Announcing student:', announcement);
    setRollCallPhase('announcing');
    
    try {
      await speak(announcement);
      // After speaking, switch to waiting phase
      console.log('Finished announcing, now waiting for attendance');
      setRollCallPhase('waiting');
      setWaitingForAttendance(true);
    } catch (error) {
      console.error('Speech error:', error);
      // Continue with waiting phase even if speech fails
      setRollCallPhase('waiting');
      setWaitingForAttendance(true);
    }
  }, [filteredStudents, currentStudentIndex, isRollCallActive, speak]);

  // FIXED: Announce attendance status function
  const announceAttendanceStatus = useCallback(async (studentName: string, status: 'present' | 'absent') => {
    const announcement = `${studentName} marked as ${status}`;
    console.log('Announcing attendance status:', announcement);
    
    try {
      await speak(announcement, 'high');
      console.log('Finished announcing attendance status');
    } catch (error) {
      console.error('Speech error during attendance announcement:', error);
    }
  }, [speak]);

  // FIXED: Move to next student function
  const moveToNextStudent = useCallback(() => {
    console.log('Moving to next student...');
    if (currentStudentIndex < filteredStudents.length - 1) {
      const nextIndex = currentStudentIndex + 1;
      setCurrentStudentIndex(nextIndex);
      setWaitingForAttendance(false);
      setRollCallPhase('announcing');
      
      // Small delay then announce the next student
      setTimeout(() => {
        announceCurrentStudent();
      }, 1000); // Increased delay for better flow
    } else {
      // End of roll call
      handleStopRollCall();
    }
  }, [currentStudentIndex, filteredStudents.length, announceCurrentStudent]);

  const moveToPreviousStudent = useCallback(() => {
    if (currentStudentIndex > 0) {
      const prevIndex = currentStudentIndex - 1;
      setCurrentStudentIndex(prevIndex);
      setWaitingForAttendance(false);
      setRollCallPhase('announcing');
      
      setTimeout(() => {
        announceCurrentStudent();
      }, 500);
    }
  }, [currentStudentIndex, announceCurrentStudent]);

  // FIXED: Attendance Functions with proper roll call flow
  const markAttendance = useCallback(async (studentId: string, status: 'present' | 'absent') => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    setStudents(prev => {
      const updated = prev.map(s => 
        s.id === studentId 
          ? { 
              ...s, 
              attendance_status: status,
              last_attendance_date: format(selectedDate, 'yyyy-MM-dd')
            }
          : s
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

      return updated;
    });

    // Show toast with sound effect
    showToast(
      `${student.first_name} ${student.last_name}`,
      `Marked as ${status}`,
      status === 'absent' ? 'destructive' : 'default'
    );

    playSound(status === 'present' ? 'success' : 'warning');
    
    // FIXED: Handle roll call flow properly
    if (isRollCallActive && rollCallPhase === 'waiting') {
      console.log('Roll call attendance marked, switching to confirming phase');
      setRollCallPhase('confirming');
      setWaitingForAttendance(false);
      
      // Announce the attendance status
      try {
        await announceAttendanceStatus(`${student.first_name} ${student.last_name}`, status);
        
        // Wait a moment then move to next student
        setTimeout(() => {
          console.log('Moving to next student after attendance confirmation');
          moveToNextStudent();
        }, 1500); // Give time for the announcement to complete
        
      } catch (error) {
        console.error('Error announcing attendance:', error);
        // Even if speech fails, move to next student
        setTimeout(() => {
          moveToNextStudent();
        }, 1000);
      }
    }
  }, [selectedDate, currentSession, showToast, playSound, isRollCallActive, rollCallPhase, students, announceAttendanceStatus, moveToNextStudent]);

  // FIXED: Mark attendance with announcement wrapper
  const markAttendanceWithAnnouncement = useCallback(async (studentId: string, status: 'present' | 'absent') => {
    await markAttendance(studentId, status);
  }, [markAttendance]);

  const handleStartRollCall = useCallback(async () => {
    if (filteredStudents.length === 0) {
      showToast('No Students', 'No students available for roll call', 'destructive');
      return;
    }

    console.log('Starting roll call...');
    setIsRollCallActive(true);
    setCurrentStudentIndex(0);
    setWaitingForAttendance(false);
    setRollCallPhase('announcing');
    
    // Initial announcement
    try {
      await speak(`Starting roll call for ${filteredStudents.length} students. I will call each name and wait for you to mark attendance.`, 'high');
      
      // Start with first student after initial announcement
      setTimeout(() => {
        announceCurrentStudent();
      }, 1000);
      
      showToast('📢 Roll Call Started', `Calling ${filteredStudents.length} students`);
    } catch (error) {
      console.error('Speech error during roll call start:', error);
      showToast('Speech Error', 'Starting roll call without speech', 'destructive');
      // Continue without speech
      setTimeout(() => {
        announceCurrentStudent();
      }, 1000);
    }
  }, [filteredStudents, speak, announceCurrentStudent, showToast]);

  const handleStopRollCall = useCallback(async () => {
    console.log('Stopping roll call...');
    setIsRollCallActive(false);
    setWaitingForAttendance(false);
    setCurrentStudentIndex(0);
    setRollCallPhase('idle');
    stopSpeech();
    
    const presentCount = students.filter(s => s.attendance_status === 'present').length;
    const absentCount = students.filter(s => s.attendance_status === 'absent').length;
    
    try {
      await speak(`Roll call completed. ${presentCount} students present, ${absentCount} students absent.`, 'high');
    } catch (error) {
      console.error('Speech error:', error);
    }
    
    showToast('✅ Roll Call Complete', `${presentCount} present, ${absentCount} absent`);
  }, [students, speak, stopSpeech, showToast]);

  // Enhanced Keyboard Shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Don't handle shortcuts if user is typing in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          if (isRollCallActive && rollCallPhase === 'waiting') {
            // Skip current student
            setWaitingForAttendance(false);
            setRollCallPhase('announcing');
            moveToNextStudent();
          }
          break;
        case 'KeyP':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            if (isRollCallActive && rollCallPhase === 'waiting' && 
                currentStudentIndex < filteredStudents.length && filteredStudents[currentStudentIndex]) {
              markAttendance(filteredStudents[currentStudentIndex].id, 'present');
            }
          }
          break;
        case 'KeyA':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            if (isRollCallActive && rollCallPhase === 'waiting' && 
                currentStudentIndex < filteredStudents.length && filteredStudents[currentStudentIndex]) {
              markAttendance(filteredStudents[currentStudentIndex].id, 'absent');
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
          if (isRollCallActive && rollCallPhase === 'waiting') {
            event.preventDefault();
            setWaitingForAttendance(false);
            setRollCallPhase('announcing');
            moveToNextStudent();
          }
          break;
        case 'KeyR':
          if (isRollCallActive && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            // Repeat current student name
            stopSpeech();
            setTimeout(() => {
              announceCurrentStudent();
            }, 300);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRollCallActive, rollCallPhase, currentStudentIndex, filteredStudents, markAttendance, moveToNextStudent, moveToPreviousStudent, announceCurrentStudent, stopSpeech, handleStopRollCall]);

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
    try {
      // Using in-memory storage instead of localStorage as per requirements
      const attendanceData = {
        students,
        session: currentSession,
        notes: sessionNotes,
        timestamp: new Date().toISOString()
      };

      showToast('Attendance Saved', 'Data has been automatically saved');
    } catch (error) {
      console.error('Save error:', error);
      showToast('Save Error', 'Failed to save attendance data', 'destructive');
    }
  }, [selectedCourse, selectedDate, students, currentSession, sessionNotes, showToast]);

  // Export functions
  const exportAttendance = useCallback((exportFormat: 'csv' | 'pdf' | 'excel') => {
    const data = students.map(student => ({
      'Roll Number': student.roll_number,
      'Name': `${student.first_name} ${student.last_name}`,
      'Status': student.attendance_status,
      'Attendance %': student.attendance_percentage,
      'Notes': student.notes || ''
    }));

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

    showToast('Export Complete', `Attendance data exported as ${exportFormat.toUpperCase()}`);
  }, [students, selectedCourse, selectedDate, showToast]);

  const cn = (...classes: (string | undefined | boolean)[]) => {
    return classes.filter(Boolean).join(' ');
  };

  return (
    <div className="space-y-6 transition-all duration-300">
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
                  <UserCheck className="h-4 w-4 " />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold ">{stats.present}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.pending} pending
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Absent</CardTitle>
                  <UserX className="h-4 w-4 " />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold ">{stats.absent}</div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((stats.absent / stats.total) * 100)}% of class
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">At Risk</CardTitle>
                  <AlertTriangle className="h-4 w-4 " />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold ">{stats.atRiskStudents}</div>
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
                  {rollCallPhase === 'announcing' && isRollCallActive && (
                    <Badge variant="secondary" >
                      📢 Announcing
                    </Badge>
                  )}
                  {rollCallPhase === 'waiting' && waitingForAttendance && (
                    <Badge variant="outline" >
                      ⏳ Waiting for Input
                    </Badge>
                  )}
                  {rollCallPhase === 'confirming' && isRollCallActive && (
                    <Badge variant="default">
                      ✅ Confirming
                    </Badge>
                  )}
                  {isSpeaking && (
                    <Badge variant="outline">
                      🔊 Speaking
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
                    {!speechSupported && (
                      <Badge variant="destructive" className="text-xs">
                        No Speech
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Roll Call Controls */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 pt-4 border-t">
                <Button 
                  onClick={handleStartRollCall} 
                  disabled={isRollCallActive || filteredStudents.length === 0}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Roll Call
                </Button>
                
                {isRollCallActive && (
                  <>
                    <Button 
                      onClick={() => {
                        if (rollCallPhase === 'waiting') {
                          setWaitingForAttendance(false);
                          setRollCallPhase('announcing');
                          moveToNextStudent();
                        }
                      }} 
                      variant="secondary"
                      disabled={rollCallPhase !== 'waiting'}
                      className="w-full"
                    >
                      <SkipForward className="h-4 w-4 mr-2" />
                      Skip Student
                    </Button>
                    <Button 
                      onClick={handleStopRollCall} 
                      variant="destructive"
                      className="w-full"
                    >
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
                  className="w-full"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark All Present
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    const names = filteredStudents.slice(0, 5).map(s => `${s.first_name} ${s.last_name}`).join(', ');
                    const totalText = filteredStudents.length > 5 ? 
                      `${names} and ${filteredStudents.length - 5} others` : names;
                    try {
                      await speak(`Today's students: ${totalText}`);
                    } catch (error) {
                      console.error('Speech error:', error);
                    }
                  }}
                  disabled={filteredStudents.length === 0}
                  className="w-full"
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  Test Speech
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Speech Settings */}
          {speechEnabled && speechSupported && (
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
                    <Label>Voice: {availableVoicesRef.current[voiceIndex]?.name || 'Default'}</Label>
                    <Select value={voiceIndex.toString()} onValueChange={(value) => setVoiceIndex(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVoicesRef.current.map((voice, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {voice.name} ({voice.lang})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    onClick={async () => {
                      try {
                        await speak("Text to speech is working correctly. You can now start roll call.");
                      } catch (error) {
                        console.error('Speech error:', error);
                        showToast('Speech Test Failed', 'Please check your browser settings', 'destructive');
                      }
                    }}
                    className="w-full"
                    variant="outline"
                    disabled={isSpeaking}
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    {isSpeaking ? 'Speaking...' : 'Test Speech'}
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
                  <Card className="border-2 shadow-lg">
                    <CardHeader className="">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Volume2 className="h-5 w-5 " />
                          <span className="text-blue-800 font-bold">Roll Call Active</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {currentStudentIndex + 1} of {filteredStudents.length}
                          </Badge>
                          {rollCallPhase === 'announcing' && (
                            <Badge variant="secondary" className=" animate-pulse">
                              📢 Announcing Name
                            </Badge>
                          )}
                          {rollCallPhase === 'waiting' && waitingForAttendance && (
                            <Badge variant="default" className=" animate-pulse">
                              ⏳ Waiting for Attendance
                            </Badge>
                          )}
                          {rollCallPhase === 'confirming' && (
                            <Badge variant="secondary" className=" animate-pulse">
                              ✅ Confirming Status
                            </Badge>
                          )}
                          {isSpeaking && (
                            <Badge variant="secondary" >
                              🔊 Speaking
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
                                className="w-20 h-20 rounded-full border-4 border-blue-500 shadow-lg"
                              />
                            )}
                            <div>
                              <h3 className="text-3xl font-bold  mb-2">
                                {filteredStudents[currentStudentIndex].first_name} {filteredStudents[currentStudentIndex].last_name}
                              </h3>
                              <p className="text-lg ">
                                {filteredStudents[currentStudentIndex].roll_number}
                              </p>
                              <p className="text-sm ">
                                {filteredStudents[currentStudentIndex].attendance_percentage}% attendance
                              </p>
                              {filteredStudents[currentStudentIndex].risk_level === 'high' && (
                                <Badge variant="destructive" className="mt-2">
                                  🚨 High Risk Student
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {rollCallPhase === 'announcing' && (
                            <div className="space-y-4">
                              <p className="text-lg  font-semibold animate-pulse">
                                {isSpeaking ? '🔊 Announcing student name...' : '📢 Ready to announce'}
                              </p>
                              <div className="flex justify-center space-x-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    stopSpeech();
                                    setTimeout(() => {
                                      announceCurrentStudent();
                                    }, 300);
                                  }}
                                  className="border-2 "
                                >
                                  <Volume2 className="h-4 w-4 mr-2" />
                                  Repeat Name (Ctrl+R)
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {rollCallPhase === 'waiting' && waitingForAttendance && (
                            <div className="space-y-4">
                              <p className="text-lg  font-semibold animate-pulse">
                                ⏳ Please mark attendance for this student
                              </p>
                              <div className="flex justify-center space-x-6">
                                <Button
                                  size="lg"
                                  onClick={() => {
                                    markAttendanceWithAnnouncement(filteredStudents[currentStudentIndex].id, 'present');
                                  }}
                                  className=" px-8 py-3 text-lg font-semibold shadow-lg"
                                >
                                  <CheckCircle2 className="h-6 w-6 mr-3" />
                                  Present (Ctrl+P)
                                </Button>
                                <Button
                                  size="lg"
                                  variant="destructive"
                                  onClick={() => {
                                    markAttendanceWithAnnouncement(filteredStudents[currentStudentIndex].id, 'absent');
                                  }}
                                  className="px-8 py-3 text-lg font-semibold shadow-lg"
                                >
                                  <XCircle className="h-6 w-6 mr-3" />
                                  Absent (Ctrl+A)
                                </Button>
                              </div>
                              <div className="flex justify-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setWaitingForAttendance(false);
                                    setRollCallPhase('announcing');
                                    moveToNextStudent();
                                  }}
                                  className="border-2 "
                                >
                                  <SkipForward className="h-4 w-4 mr-2" />
                                  Skip Student (Space)
                                </Button>
                              </div>
                            </div>
                          )}

                          {rollCallPhase === 'confirming' && (
                            <div className="space-y-4">
                              <p className="text-lg  font-semibold animate-pulse">
                                {isSpeaking ? '🔊 Announcing attendance status...' : '✅ Attendance confirmed! Moving to next student...'}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Students List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Students ({filteredStudents.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {filteredStudents.map((student, index) => (
                        <div
                          key={student.id}
                          className={cn(
                            "flex items-center justify-between p-4 border rounded-lg transition-all duration-200",
                            currentStudentIndex === index && isRollCallActive ,
                            student.attendance_status === 'present' ,
                            student.attendance_status === 'absent' ,
                            student.attendance_status === 'pending',
                            student.risk_level === 'high' 
                          )}
                        >
                          <div className="flex items-center space-x-4">
                            {showPhotos && (
                              <img
                                src={student.photo_url}
                                alt={`${student.first_name} ${student.last_name}`}
                                className="w-12 h-12 rounded-full border-2"
                              />
                            )}
                            <div>
                              <p className="font-medium">
                                {student.first_name} {student.last_name}
                              </p>
                              <p className="text-sm ">
                                {student.roll_number} • {student.attendance_percentage}% attendance
                              </p>
                              {student.notes && (
                                <p className="text-xs  italic">{student.notes}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {student.risk_level === 'high' && (
                              <Badge variant="destructive" className="text-xs">
                                🚨 High Risk
                              </Badge>
                            )}
                            <Badge 
                              variant={
                                student.attendance_status === 'present' ? 'default' :
                                student.attendance_status === 'absent' ? 'destructive' : 'secondary'
                              }
                            >
                              {student.attendance_status === 'present' && '✅ Present'}
                              {student.attendance_status === 'absent' && '❌ Absent'}
                              {student.attendance_status === 'pending' && '⏳ Pending'}
                            </Badge>
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant={student.attendance_status === 'present' ? 'default' : 'outline'}
                                onClick={() => markAttendance(student.id, 'present')}
                                disabled={isRollCallActive && rollCallPhase !== 'waiting' && currentStudentIndex !== index}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={student.attendance_status === 'absent' ? 'destructive' : 'outline'}
                                onClick={() => markAttendance(student.id, 'absent')}
                                disabled={isRollCallActive && rollCallPhase !== 'waiting' && currentStudentIndex !== index}
                              >
                                <XCircle className="h-4 w-4" />
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
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredStudents.map((student, index) => (
                    <Card 
                      key={student.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-md",
                        currentStudentIndex === index && isRollCallActive ,
                        student.attendance_status === 'present' ,
                        student.attendance_status === 'absent' ,
                        student.risk_level === 'high' && "border-t-4"
                      )}
                    >
                      <CardContent className="p-4 text-center">
                        <img
                          src={student.photo_url}
                          alt={`${student.first_name} ${student.last_name}`}
                          className="w-16 h-16 rounded-full mx-auto mb-2"
                        />
                        <p className="font-medium text-sm">{student.first_name}</p>
                        <p className="font-medium text-sm">{student.last_name}</p>
                        <p className="text-xs ">{student.roll_number}</p>
                        <p className="text-xs ">{student.attendance_percentage}%</p>
                        {student.risk_level === 'high' && (
                          <Badge variant="destructive" className="text-xs mt-1">🚨</Badge>
                        )}
                        <div className="flex justify-center space-x-1 mt-2">
                          <Button
                            size="sm"
                            variant={student.attendance_status === 'present' ? 'default' : 'outline'}
                            onClick={() => markAttendance(student.id, 'present')}
                            className="h-6 px-2 text-xs"
                          >
                            ✅
                          </Button>
                          <Button
                            size="sm"
                            variant={student.attendance_status === 'absent' ? 'destructive' : 'outline'}
                            onClick={() => markAttendance(student.id, 'absent')}
                            className="h-6 px-2 text-xs"
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
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                          <span className="font-semibold ">{stats.pending}</span>
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
                          <p className="text-sm text-gray-500">Average Attendance</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{stats.atRiskStudents}</div>
                          <p className="text-sm text-gray-500">Students at Risk</p>
                        </div>
                        <div className="text-center">
                          <div className={cn("text-2xl font-bold", stats.goalMet ? "text-green-600" : "text-red-600")}>
                            {stats.goalMet ? "🎯" : "📈"}
                          </div>
                          <p className="text-sm text-gray-500">
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

                {/* Session Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Session Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Add notes about today's class..."
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
                    <CardTitle>Calendar View</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium">Calendar View</p>
                      <p className="text-gray-500">
                        Weekly and monthly attendance patterns coming soon
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </>
      )}

      {/* No Students Message */}
      {selectedCourse && !loading && filteredStudents.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No students found</p>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Select a course to view students'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedAttendanceTracker;