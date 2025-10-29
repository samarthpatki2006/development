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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

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
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'analytics'>('list');
  
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
    }
  };

  // Roll call handlers
  const handleRollCallStart = () => {
    setIsRollCallActive(true);
    setCurrentStudentIndex(0);
  };

  const handleRollCallPause = () => {
    setIsRollCallActive(false);
  };

  const handleRollCallStop = () => {
    setIsRollCallActive(false);
    setCurrentStudentIndex(0);
  };

  const handleNextStudent = () => {
    if (currentStudentIndex < students.length - 1) {
      const nextIndex = currentStudentIndex + 1;
      setCurrentStudentIndex(nextIndex);
    }
  };

  const handlePreviousStudent = () => {
    if (currentStudentIndex > 0) {
      const prevIndex = currentStudentIndex - 1;
      setCurrentStudentIndex(prevIndex);
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

  // Keyboard shortcuts
  const handleSpacePress = () => {
    if (isRollCallActive && filteredStudents.length > 0 && currentStudentIndex < filteredStudents.length) {
      const currentStudent = filteredStudents[currentStudentIndex];
      if (currentStudent && currentStudent.attendance_status === 'pending') {
        setPendingStudentId(currentStudent.id);
        setShowConfirmDialog(true);
      }
    }
  };

  const handleEscapePress = () => {
    if (showConfirmDialog) {
      setShowConfirmDialog(false);
      setPendingStudentId(null);
    }
  };

  // Confirmation dialog handlers
  const handleConfirmAbsent = async () => {
    if (pendingStudentId && selectedCourse) {
      await markAttendance(pendingStudentId, 'absent', selectedCourse);
      setShowConfirmDialog(false);
      setPendingStudentId(null);
      
      // Move to next student
      if (currentStudentIndex < filteredStudents.length - 1) {
        setCurrentStudentIndex(currentStudentIndex + 1);
      } else {
        // End of list, stop roll call
        handleRollCallStop();
      }
    }
  };

  const handleConfirmPresent = async () => {
    if (pendingStudentId && selectedCourse) {
      await markAttendance(pendingStudentId, 'present', selectedCourse);
      setShowConfirmDialog(false);
      setPendingStudentId(null);
      
      // Move to next student
      if (currentStudentIndex < filteredStudents.length - 1) {
        setCurrentStudentIndex(currentStudentIndex + 1);
      } else {
        // End of list, stop roll call
        handleRollCallStop();
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
  }, [selectedCourse]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Attendance Tracking</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Efficiently mark and track student attendance with interactive tools
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs sm:text-sm text-muted-foreground">
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
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span>Select Class</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCourse} onValueChange={handleCourseChange}>
            <SelectTrigger className="w-full max-w-md [&>span]:truncate">
              <SelectValue placeholder="Choose a class to mark attendance" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  <span className="truncate">{course.code} - {course.name}</span>
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
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="text-base sm:text-lg">Attendance Controls</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {filteredStudents.length} students
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {selectedDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Selection */}
                <div className="space-y-2">
                  <Label htmlFor="date-select" className="text-xs sm:text-sm">Class Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal text-xs sm:text-sm",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">
                          {selectedDate ? selectedDate.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          }) : <span>Pick a date</span>}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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
                  <Label htmlFor="search" className="text-xs sm:text-sm">Search Students</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Name or roll number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Filter by Status */}
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Filter by Status</Label>
                  <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                    <SelectTrigger className="text-xs sm:text-sm">
                      <Filter className="mr-2 h-4 w-4 flex-shrink-0" />
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
                  <Label className="text-xs sm:text-sm">View Mode</Label>
                  <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                    <SelectTrigger className="text-xs sm:text-sm">
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
                  className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="hidden lg:inline">Export Attendance</span>
                  <span className="hidden sm:inline lg:hidden">Export</span>
                  <span className="sm:hidden">Export</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4"
                >
                  <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="hidden lg:inline">Import Data</span>
                  <span className="hidden sm:inline lg:hidden">Import</span>
                  <span className="sm:hidden">Import</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4"
                >
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="hidden lg:inline">Generate Report</span>
                  <span className="hidden sm:inline lg:hidden">Report</span>
                  <span className="sm:hidden">Report</span>
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
                  className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4"
                >
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="hidden lg:inline">Mark All Present</span>
                  <span className="hidden sm:inline lg:hidden">All Present</span>
                  <span className="sm:hidden">Present</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Tabs View */}
          <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="list" className="text-xs sm:text-sm">List View</TabsTrigger>
              <TabsTrigger value="grid" className="text-xs sm:text-sm">Grid View</TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-6">
              {/* Loading State */}
              {loading && (
                <Card>
                  <CardContent className="text-center py-8 sm:py-12">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-sm sm:text-base text-muted-foreground">Loading students for selected course...</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">
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
                  <CardContent className="text-center py-8 sm:py-12">
                    <Search className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-base sm:text-lg font-medium text-foreground">No students found</p>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Try adjusting your search term or filter criteria
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm('');
                        setFilterStatus('all');
                      }}
                      className="mt-4 text-xs sm:text-sm"
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

            <TabsContent value="grid" className="space-y-6 max-h-[500px] overflow-auto">
              {/* Grid View - Coming Soon */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Grid View</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4">
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
                        <CardContent className="p-3 sm:p-4 text-center">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-base sm:text-lg font-semibold text-primary">
                              {student.first_name[0]}{student.last_name[0]}
                            </span>
                          </div>
                          <p className="font-medium text-xs sm:text-sm truncate">{student.first_name}</p>
                          <p className="font-medium text-xs sm:text-sm truncate">{student.last_name}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{student.roll_number}</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Today's Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex justify-between text-sm sm:text-base">
                        <span>Present:</span>
                        <span className="font-semibold text-green-600">
                          {filteredStudents.filter(s => s.attendance_status === 'present').length}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base">
                        <span>Absent:</span>
                        <span className="font-semibold text-red-600">
                          {filteredStudents.filter(s => s.attendance_status === 'absent').length}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base">
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
                    <CardTitle className="text-base sm:text-lg">Attendance Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-primary">
                        {filteredStudents.length > 0 
                          ? Math.round((filteredStudents.filter(s => s.attendance_status === 'present').length / filteredStudents.length) * 100)
                          : 0}%
                      </div>
                      <p className="text-sm sm:text-base text-muted-foreground">Overall Rate</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span>Total Students:</span>
                        <span className="font-semibold">{filteredStudents.length}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span>Class Date:</span>
                        <span className="font-semibold">{selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
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