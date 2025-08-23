import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Calendar, Database, AlertCircle, CalendarDays, Search, Filter, Download, Upload, Clock, BarChart3 } from 'lucide-react';
import { Student } from './types';
import { useAttendanceData } from './hooks/useAttendanceData';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useRealTimeAttendanceCalculations } from './hooks/useAttendanceCalculations';
import { useMurfSpeech } from './hooks/useMurfSpeech';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import StudentList from './StudentList';
import AttendanceStats from './AttendanceStats';
import RollCallInterface from './RollCallInterface';
import AttendanceConfirmDialog from './AttendanceConfirmDialog';
import ErrorDisplay from './ErrorDisplay';
import FallbackUI from './FallbackUI';
import LoadingOverlay from './LoadingOverlay';
import { createFallbackUIState } from './utils/errorHandler';

interface AttendanceTrackingProps {
  teacherData: {
    user_id: string;
    first_name: string;
    last_name: string;
  };
}

interface Course {
  id: string;
  name: string;
  code: string;
}

const AttendanceTracking: React.FC<AttendanceTrackingProps> = ({ teacherData }) => {
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentStudentIndex, setCurrentStudentIndex] = useState<number>(0);
  const [isRollCallActive, setIsRollCallActive] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [pendingStudentId, setPendingStudentId] = useState<string | null>(null);
  const [attendanceVersion, setAttendanceVersion] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'absent' | 'pending'>('all');
  const [speechPaused, setSpeechPaused] = useState<boolean>(false);
  const [lastSpokenIndex, setLastSpokenIndex] = useState<number>(-1);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'analytics'>('list');
  
  // Use Murf speech API
  const {
    speak: speakText,
    stop: stopSpeech,
    pause: pauseSpeech,
    resume: resumeSpeech,
    isSpeaking,
    isLoading: speechLoading,
    error: speechError
  } = useMurfSpeech();

  // Use the attendance data hook
  const {
    students,
    loading,
    loadingState,
    error,
    fetchStudents,
    insertDemoData,
    markAttendance,
    clearError,
    retryLastOperation
  } = useAttendanceData(teacherData.user_id);

  // Debug logging
  useEffect(() => {
    console.log('Students updated:', students.length, students);
  }, [students]);

  useEffect(() => {
    console.log('Loading state:', loading);
  }, [loading]);

  useEffect(() => {
    console.log('Selected course:', selectedCourse);
  }, [selectedCourse]);

  // Force stats recalculation when students change
  useEffect(() => {
    if (students.length > 0) {
      console.log('Triggering stats recalculation for', students.length, 'students');
      setAttendanceVersion(prev => prev + 1);
    }
  }, [students]);

  // Use real-time calculations for immediate updates
  const {
    dailyStats,
    classStats,
    enhancedStudents,
    updateStudentAttendance
  } = useRealTimeAttendanceCalculations(students);
  
  // Mock courses data for basic functionality
  const [courses] = useState<Course[]>([
    { id: '1', name: 'Computer Science 101', code: 'CS101' },
    { id: '2', name: 'Data Structures', code: 'CS201' },
    { id: '3', name: 'Web Development', code: 'CS301' }
  ]);

  const handleCourseChange = (courseId: string) => {
    console.log('Course selected:', courseId);
    setSelectedCourse(courseId);
    if (courseId) {
      console.log('Fetching students for course:', courseId);
      fetchStudents(courseId);
    }
  };

  const handleInsertDemoData = async () => {
    await insertDemoData();
  };

  const handleAttendanceToggle = async (studentId: string, status: 'present' | 'absent') => {
    if (selectedCourse) {
      // Apply optimistic update immediately for instant UI feedback
      const optimisticCalculations = updateStudentAttendance(studentId, status);
      
      // Force re-render to update all stats immediately
      setAttendanceVersion(prev => prev + 1);
      
      // Persist to database (this will also update the students state)
      await markAttendance(studentId, status, selectedCourse);
      
      // Force another re-render after database update
      setAttendanceVersion(prev => prev + 1);
      
      // Announce the action for accessibility
      const student = students.find(s => s.id === studentId);
      if (student) {
        try {
          await speakText(`${student.first_name} ${student.last_name} marked as ${status}`);
        } catch (error) {
          console.error('Speech error:', error);
        }
      }
    }
  };

  // Roll call handlers with Murf speech
  const handleRollCallStart = async () => {
    setIsRollCallActive(true);
    setCurrentStudentIndex(0);
    
    // Announce roll call start
    if (filteredStudents.length > 0) {
      try {
        await speakText(`Starting roll call for ${filteredStudents.length} students. Press space to mark attendance.`);
        // Announce first student
        if (filteredStudents[0]) {
          setTimeout(async () => {
            await speakText(`${filteredStudents[0].first_name} ${filteredStudents[0].last_name}`);
          }, 2000);
        }
      } catch (error) {
        console.error('Speech error:', error);
      }
    }
  };

  const handleRollCallPause = () => {
    setIsRollCallActive(false);
    pauseSpeech();
  };

  const handleRollCallStop = async () => {
    setIsRollCallActive(false);
    setCurrentStudentIndex(0);
    stopSpeech();
    
    // Announce roll call completion
    const presentCount = students.filter(s => s.attendance_status === 'present').length;
    const absentCount = students.filter(s => s.attendance_status === 'absent').length;
    
    try {
      await speakText(`Roll call completed. ${presentCount} students present, ${absentCount} students absent.`);
    } catch (error) {
      console.error('Speech error:', error);
    }
  };

  const handleNextStudent = async () => {
    if (currentStudentIndex < students.length - 1) {
      const nextIndex = currentStudentIndex + 1;
      setCurrentStudentIndex(nextIndex);
      
      // Announce next student
      if (isRollCallActive && filteredStudents[nextIndex]) {
        try {
          await speakText(`${filteredStudents[nextIndex].first_name} ${filteredStudents[nextIndex].last_name}`);
        } catch (error) {
          console.error('Speech error:', error);
        }
      }
    }
  };

  const handlePreviousStudent = async () => {
    if (currentStudentIndex > 0) {
      const prevIndex = currentStudentIndex - 1;
      setCurrentStudentIndex(prevIndex);
      
      // Announce previous student
      if (isRollCallActive && filteredStudents[prevIndex]) {
        try {
          await speakText(`${filteredStudents[prevIndex].first_name} ${filteredStudents[prevIndex].last_name}`);
        } catch (error) {
          console.error('Speech error:', error);
        }
      }
    }
  };

  const handleCurrentIndexChange = (index: number) => {
    if (index >= 0 && index < students.length) {
      setCurrentStudentIndex(index);
    }
  };

  // Filter and search students
  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm === '' || 
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.roll_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || student.attendance_status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Enhanced keyboard shortcuts with speech synchronization
  const handleSpacePress = () => {
    if (isRollCallActive && filteredStudents.length > 0 && currentStudentIndex < filteredStudents.length) {
      const currentStudent = filteredStudents[currentStudentIndex];
      if (currentStudent && currentStudent.attendance_status === 'pending') {
        setSpeechPaused(true);
        pauseSpeech();
        setLastSpokenIndex(currentStudentIndex);
        setPendingStudentId(currentStudent.id);
        setShowConfirmDialog(true);
      }
    }
  };

  const handleEscapePress = () => {
    if (showConfirmDialog) {
      setShowConfirmDialog(false);
      setPendingStudentId(null);
      setSpeechPaused(false);
      resumeSpeech();
      // Resume speech from where it left off
      if (lastSpokenIndex >= 0) {
        setCurrentStudentIndex(lastSpokenIndex);
      }
    }
  };

  // Confirmation dialog handlers with speech synchronization
  const handleConfirmAbsent = async () => {
    if (pendingStudentId && selectedCourse) {
      await markAttendance(pendingStudentId, 'absent', selectedCourse);
      setShowConfirmDialog(false);
      setPendingStudentId(null);
      setSpeechPaused(false);
      
      // Move to next student and resume speech
      if (currentStudentIndex < filteredStudents.length - 1) {
        setCurrentStudentIndex(currentStudentIndex + 1);
        // Announce next student
        if (filteredStudents[currentStudentIndex + 1]) {
          try {
            await speakText(`${filteredStudents[currentStudentIndex + 1].first_name} ${filteredStudents[currentStudentIndex + 1].last_name}`);
          } catch (error) {
            console.error('Speech error:', error);
          }
        }
      } else {
        // End of list, stop roll call
        await handleRollCallStop();
      }
    }
  };

  const handleConfirmPresent = async () => {
    if (pendingStudentId && selectedCourse) {
      await markAttendance(pendingStudentId, 'present', selectedCourse);
      setShowConfirmDialog(false);
      setPendingStudentId(null);
      setSpeechPaused(false);
      
      // Move to next student and resume speech
      if (currentStudentIndex < filteredStudents.length - 1) {
        setCurrentStudentIndex(currentStudentIndex + 1);
        // Announce next student
        if (filteredStudents[currentStudentIndex + 1]) {
          try {
            await speakText(`${filteredStudents[currentStudentIndex + 1].first_name} ${filteredStudents[currentStudentIndex + 1].last_name}`);
          } catch (error) {
            console.error('Speech error:', error);
          }
        }
      } else {
        // End of list, stop roll call
        await handleRollCallStop();
      }
    }
  };

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    onSpacePress: handleSpacePress,
    onEscapePress: handleEscapePress,
    isActive: isRollCallActive || showConfirmDialog
  });

  // Reset current student index when course changes
  useEffect(() => {
    setCurrentStudentIndex(0);
    setIsRollCallActive(false);
    setShowConfirmDialog(false);
    setPendingStudentId(null);
    stopSpeech();
  }, [selectedCourse, stopSpeech]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendance Tracking</h1>
          <p className="text-muted-foreground mt-1">
            Efficiently mark and track student attendance with interactive tools
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>
      </div>

      {/* Course Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Select Class</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCourse} onValueChange={handleCourseChange}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Choose a class to mark attendance" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Enhanced Error Display */}
      {error && (
        <ErrorDisplay 
          error={error} 
          onDismiss={clearError}
          className="mb-6"
        />
      )}

      {/* Course Content */}
      {selectedCourse && (
        <div className="space-y-6">
          {/* Enhanced Controls Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-5 w-5" />
                  <span>Attendance Controls</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {filteredStudents.length} students
                  </Badge>
                  <Badge variant="outline">
                    {format(selectedDate, "MMM dd, yyyy")}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Selection */}
                <div className="space-y-2">
                  <Label htmlFor="date-select">Class Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarIcon
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Search Students */}
                <div className="space-y-2">
                  <Label htmlFor="search">Search Students</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Name or roll number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                {/* Filter by Status */}
                <div className="space-y-2">
                  <Label>Filter by Status</Label>
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
                      <SelectItem value="analytics">Analytics View</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Attendance
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Mark all as present
                    filteredStudents.forEach(student => {
                      if (student.attendance_status === 'pending') {
                        handleAttendanceToggle(student.id, 'present');
                      }
                    });
                  }}
                  className="flex-1 sm:flex-none"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Mark All Present
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Tabs View */}
          <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="grid">Grid View</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-6">
              {/* Loading State */}
              {loading && (
                <Card>
                  <CardContent className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading students for selected course...</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      If no students are enrolled, demo data will be loaded automatically.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Error Display */}
              {error && (
                <ErrorDisplay 
                  error={error} 
                  onDismiss={clearError}
                  className="mb-6"
                />
              )}

              {/* Fallback UI for No Data */}
              {filteredStudents.length === 0 && !loading && !error && students.length === 0 && (
                <FallbackUI 
                  state={createFallbackUIState('no_data', handleInsertDemoData)}
                  className="mb-6"
                />
              )}

              {/* No Results from Search/Filter */}
              {filteredStudents.length === 0 && students.length > 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium text-foreground">No students found</p>
                    <p className="text-muted-foreground">
                      Try adjusting your search term or filter criteria
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm('');
                        setFilterStatus('all');
                      }}
                      className="mt-4"
                    >
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Attendance Statistics */}
              {filteredStudents.length > 0 && (
                <AttendanceStats 
                  key={`stats-${attendanceVersion}-${Date.now()}`}
                  students={filteredStudents} 
                  className="mb-6" 
                />
              )}

              {/* Students List */}
              {filteredStudents.length > 0 && (
                <StudentList
                  key={`studentlist-${attendanceVersion}`}
                  students={filteredStudents}
                  onAttendanceToggle={handleAttendanceToggle}
                  currentStudentIndex={currentStudentIndex}
                  isRollCallActive={isRollCallActive}
                  loading={loading}
                />
              )}
            </TabsContent>

            <TabsContent value="grid" className="space-y-6">
              {/* Grid View - Coming Soon */}
              <Card>
                <CardHeader>
                  <CardTitle>Grid View</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredStudents.map((student, index) => (
                      <Card 
                        key={student.id}
                        className={cn(
                          "cursor-pointer transition-all duration-200 hover:shadow-md",
                          currentStudentIndex === index && isRollCallActive && "ring-2 ring-primary",
                          student.attendance_status === 'present' ,
                          student.attendance_status === 'absent' ,
                          student.attendance_status === 'pending' 
                        )}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-lg font-semibold text-primary">
                              {student.first_name[0]}{student.last_name[0]}
                            </span>
                          </div>
                          <p className="font-medium text-sm">{student.first_name}</p>
                          <p className="font-medium text-sm">{student.last_name}</p>
                          <p className="text-xs text-muted-foreground">{student.roll_number}</p>
                          <div className="flex justify-center space-x-1 mt-2">
                            <Button
                              size="sm"
                              variant={student.attendance_status === 'present' ? 'default' : 'outline'}
                              onClick={() => handleAttendanceToggle(student.id, 'present')}
                              className="h-6 px-2 text-xs"
                            >
                              P
                            </Button>
                            <Button
                              size="sm"
                              variant={student.attendance_status === 'absent' ? 'destructive' : 'outline'}
                              onClick={() => handleAttendanceToggle(student.id, 'absent')}
                              className="h-6 px-2 text-xs"
                            >
                              A
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {/* Analytics View */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Today's Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Present:</span>
                        <span className="font-semibold text-green-600">
                          {filteredStudents.filter(s => s.attendance_status === 'present').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Absent:</span>
                        <span className="font-semibold text-red-600">
                          {filteredStudents.filter(s => s.attendance_status === 'absent').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pending:</span>
                        <span className="font-semibold text-yellow-600">
                          {filteredStudents.filter(s => s.attendance_status === 'pending').length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Attendance Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">
                        {filteredStudents.length > 0 
                          ? Math.round((filteredStudents.filter(s => s.attendance_status === 'present').length / filteredStudents.length) * 100)
                          : 0}%
                      </div>
                      <p className="text-muted-foreground">Overall Rate</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Students:</span>
                        <span className="font-semibold">{filteredStudents.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Class Date:</span>
                        <span className="font-semibold">{format(selectedDate, "MMM dd")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Status:</span>
                        <span className="font-semibold text-green-600">
                          {isRollCallActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Attendance Confirmation Dialog */}
      <AttendanceConfirmDialog
        isOpen={showConfirmDialog}
        studentName={
          pendingStudentId && students.length > 0
            ? (() => {
                const student = students.find(s => s.id === pendingStudentId);
                return student ? `${student.first_name} ${student.last_name}` : 'Unknown Student';
              })()
            : 'Unknown Student'
        }
        onConfirm={handleConfirmAbsent}
        onCancel={handleConfirmPresent}
        autoCloseTimer={10}
      />

      {/* Loading Overlay */}
      <LoadingOverlay loadingState={loadingState} />
    </div>
    
  );
};

export default AttendanceTracking;

