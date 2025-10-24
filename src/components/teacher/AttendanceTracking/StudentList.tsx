import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, UserCheck, UserX, Clock, TrendingUp } from 'lucide-react';
import { Student } from './types';
import { getAttendanceStatusColor } from './hooks/useAttendanceCalculations';

interface StudentListProps {
  students: Student[];
  onAttendanceToggle: (studentId: string, status: 'present' | 'absent') => void;
  currentStudentIndex?: number;
  isRollCallActive?: boolean;
  loading?: boolean;
  error?: any;
}

const StudentList: React.FC<StudentListProps> = ({
  students,
  onAttendanceToggle,
  currentStudentIndex = -1,
  isRollCallActive = false,
  loading = false,
  error = null
}) => {
  const [optimisticUpdates, setOptimisticUpdates] = React.useState<Record<string, 'present' | 'absent'>>({});
  const [percentageUpdates, setPercentageUpdates] = React.useState<Record<string, number>>({});

  const handleOptimisticToggle = (studentId: string, status: 'present' | 'absent') => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    // Calculate optimistic percentage update
    let newPercentage = student.attendance_percentage;
    if (studentId.startsWith('demo-student-')) {
      const estimatedTotalClasses = 10;
      const estimatedPresentClasses = Math.round((student.attendance_percentage / 100) * estimatedTotalClasses);

      let newPresentClasses = estimatedPresentClasses;
      let newTotalClasses = estimatedTotalClasses + 1;

      if (status === 'present') {
        newPresentClasses = estimatedPresentClasses + 1;
      }

      newPercentage = Math.round((newPresentClasses / newTotalClasses) * 100);
    }

    // Apply optimistic updates immediately
    setOptimisticUpdates(prev => ({ ...prev, [studentId]: status }));
    setPercentageUpdates(prev => ({ ...prev, [studentId]: newPercentage }));

    // Call the actual update function
    onAttendanceToggle(studentId, status);

    // Clear optimistic updates after a delay (assuming success)
    setTimeout(() => {
      setOptimisticUpdates(prev => {
        const { [studentId]: _, ...rest } = prev;
        return rest;
      });
      setPercentageUpdates(prev => {
        const { [studentId]: _, ...rest } = prev;
        return rest;
      });
    }, 2000);
  };

  const getStudentStatus = (student: Student) => {
    return optimisticUpdates[student.id] || student.attendance_status;
  };

  const getStudentPercentage = (student: Student) => {
    return percentageUpdates[student.id] ?? student.attendance_percentage;
  };
  const getStatusIcon = (status: Student['attendance_status']) => {
    switch (status) {
      case 'present':
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'absent':
        return <UserX className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: Student['attendance_status']) => {
    switch (status) {
      case 'present':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">Present</Badge>;
      case 'absent':
        return <Badge variant="destructive" className="bg-red-600 hover:bg-red-700">Absent</Badge>;
      default:
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
    }
  };



  if (students.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Student List</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No students found for this class.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="text-base sm:text-lg">Student List ({students.length})</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <span>Present</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-600 rounded-full"></div>
              <span>Absent</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
              <span>Pending</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[500px] overflow-auto">
          {students.map((student, index) => (
            <div
              key={student.id}
              className={`group relative p-3 sm:p-4 rounded-lg border transition-all duration-200 ${currentStudentIndex === index && isRollCallActive
                  ? 'border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }`}
            >
              {/* Current student indicator for roll call */}
              {currentStudentIndex === index && isRollCallActive && (
                <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary rounded-r"></div>
              )}

              {/* Top Row: Student Info */}
              <div className="flex items-center space-x-3 sm:space-x-4 mb-3">
                {getStatusIcon(getStudentStatus(student))}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm sm:text-base text-foreground truncate">
                    {student.first_name} {student.last_name}
                    {optimisticUpdates[student.id] && (
                      <span className="ml-2 text-xs text-muted-foreground animate-pulse">
                        Saving...
                      </span>
                    )}
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Roll No: {student.roll_number}
                  </p>
                </div>
                {/* Status badge - mobile only */}
                <div className="lg:hidden flex items-center">
                  {getStatusBadge(getStudentStatus(student))}
                </div>
              </div>

              {/* Bottom Row: Stats and Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Attendance Stats */}
                <div className="flex items-center justify-between sm:justify-start sm:flex-1 gap-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <div>
                      <span className={`text-sm font-semibold ${getAttendanceStatusColor(getStudentPercentage(student))}`}>
                        {getStudentPercentage(student)}%
                        {percentageUpdates[student.id] && (
                          <span className="ml-1 text-xs text-blue-600 animate-pulse">
                            (updating...)
                          </span>
                        )}
                      </span>
                      <p className="text-xs text-muted-foreground hidden sm:block">
                        Overall Attendance
                      </p>
                    </div>
                  </div>

                  {/* Progress bar - hidden on mobile, shown on tablet/desktop */}
                  <div className="hidden sm:block">
                    <Progress
                      value={getStudentPercentage(student)}
                      className="h-1.5 w-16 lg:w-20"
                    />
                  </div>

                  {/* Status badge - tablet/desktop only */}
                  <div className="hidden lg:flex items-center">
                    {getStatusBadge(getStudentStatus(student))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 sm:w-auto">
                  <Button
                    size="sm"
                    variant={getStudentStatus(student) === 'present' ? 'default' : 'outline'}
                    onClick={() => handleOptimisticToggle(student.id, 'present')}
                    disabled={loading || !!optimisticUpdates[student.id]}
                    className={`flex-1 sm:flex-initial h-8 sm:h-9 px-3 sm:px-4 transition-all duration-200 text-xs sm:text-sm ${getStudentStatus(student) === 'present'
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                        : 'hover:bg-green-50 hover:border-green-300 hover:text-green-700'
                      } ${optimisticUpdates[student.id] ? 'opacity-75' : ''}`}
                  >
                    <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1 flex-shrink-0" />
                    <span className="hidden sm:inline">Present</span>
                  </Button>
                  <Button
                    size="sm"
                    variant={getStudentStatus(student) === 'absent' ? 'destructive' : 'outline'}
                    onClick={() => handleOptimisticToggle(student.id, 'absent')}
                    disabled={loading || !!optimisticUpdates[student.id]}
                    className={`flex-1 sm:flex-initial h-8 sm:h-9 px-3 sm:px-4 transition-all duration-200 text-xs sm:text-sm ${getStudentStatus(student) === 'absent'
                        ? 'bg-red-600 hover:bg-red-700 shadow-md'
                        : 'hover:bg-red-50 hover:border-red-300 hover:text-red-700'
                      } ${optimisticUpdates[student.id] ? 'opacity-75' : ''}`}
                  >
                    <UserX className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1 flex-shrink-0" />
                    <span className="hidden sm:inline">Absent</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentList;