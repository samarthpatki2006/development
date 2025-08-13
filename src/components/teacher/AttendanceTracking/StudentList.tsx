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
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Student List ({students.length})</span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
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
        <div className="space-y-3">
          {students.map((student, index) => (
            <div
              key={student.id}
              className={`group relative flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                currentStudentIndex === index && isRollCallActive
                  ? 'border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }`}
            >
              {/* Current student indicator for roll call */}
              {currentStudentIndex === index && isRollCallActive && (
                <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary rounded-r"></div>
              )}

              <div className="flex items-center space-x-4 flex-1">
                {getStatusIcon(getStudentStatus(student))}
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">
                    {student.first_name} {student.last_name}
                    {optimisticUpdates[student.id] && (
                      <span className="ml-2 text-xs text-muted-foreground animate-pulse">
                        Saving...
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Roll No: {student.roll_number}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                {/* Real-time attendance percentage display */}
                <div className="text-right min-w-[100px]">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    <span className={`text-sm font-semibold ${getAttendanceStatusColor(getStudentPercentage(student))}`}>
                      {getStudentPercentage(student)}%
                      {percentageUpdates[student.id] && (
                        <span className="ml-1 text-xs text-blue-600 animate-pulse">
                          (updating...)
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Overall Attendance
                  </p>
                  <Progress 
                    value={getStudentPercentage(student)} 
                    className="h-1.5 w-16"
                  />
                </div>

                {/* Status badge */}
                <div className="flex items-center">
                  {getStatusBadge(getStudentStatus(student))}
                </div>

                {/* Manual toggle buttons */}
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant={getStudentStatus(student) === 'present' ? 'default' : 'outline'}
                    onClick={() => handleOptimisticToggle(student.id, 'present')}
                    disabled={loading || !!optimisticUpdates[student.id]}
                    className={`h-9 px-4 transition-all duration-200 ${
                      getStudentStatus(student) === 'present' 
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-md' 
                        : 'hover:bg-green-50 hover:border-green-300 hover:text-green-700'
                    } ${optimisticUpdates[student.id] ? 'opacity-75' : ''}`}
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    Present
                  </Button>
                  <Button
                    size="sm"
                    variant={getStudentStatus(student) === 'absent' ? 'destructive' : 'outline'}
                    onClick={() => handleOptimisticToggle(student.id, 'absent')}
                    disabled={loading || !!optimisticUpdates[student.id]}
                    className={`h-9 px-4 transition-all duration-200 ${
                      getStudentStatus(student) === 'absent' 
                        ? 'bg-red-600 hover:bg-red-700 shadow-md' 
                        : 'hover:bg-red-50 hover:border-red-300 hover:text-red-700'
                    } ${optimisticUpdates[student.id] ? 'opacity-75' : ''}`}
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    Absent
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Demo data indicator */}
        {students.some(s => s.id.startsWith('demo-student-')) && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-blue-800 font-medium">
                Demo Data Active
              </p>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              You are currently viewing sample data for testing purposes. Real attendance data will be saved to the database.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentList;