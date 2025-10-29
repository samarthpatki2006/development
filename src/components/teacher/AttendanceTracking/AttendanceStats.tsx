import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, UserCheck, UserX, TrendingUp } from 'lucide-react';
import { Student } from './types';
import { useAttendanceCalculations, getAttendanceStatusColor } from './hooks/useAttendanceCalculations';

interface AttendanceStatsProps {
  students: Student[];
  className?: string;
}

const AttendanceStats: React.FC<AttendanceStatsProps> = ({ students, className = "" }) => {
  const [isUpdating, setIsUpdating] = React.useState(false);
  const {
    totalStudents,
    presentCount,
    absentCount,
    pendingCount,
    overallPercentage,
    averageCumulativeAttendance,
    studentsWithGoodAttendance,
    attendanceDistribution
  } = useAttendanceCalculations(students);

  // Debug logging for real-time updates
  React.useEffect(() => {
    console.log('AttendanceStats: Stats updated', {
      totalStudents,
      presentCount,
      absentCount,
      pendingCount,
      overallPercentage,
      averageCumulativeAttendance
    });
    // Show visual update indicator
    setIsUpdating(true);
    const timer = setTimeout(() => setIsUpdating(false), 1000);
    return () => clearTimeout(timer);
  }, [totalStudents, presentCount, absentCount, pendingCount, overallPercentage, averageCumulativeAttendance]);

  if (totalStudents === 0) {
    return null;
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 ${className} ${isUpdating ? 'animate-pulse' : ''}`}>
      {/* Total Students */}
      <Card className={isUpdating ? 'ring-2 ring-blue-500/20' : ''}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">
            Total Students
            {isUpdating && <span className="ml-1 sm:ml-2 text-xs text-blue-600">●</span>}
          </CardTitle>
          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{totalStudents}</div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Enrolled in class
          </p>
        </CardContent>
      </Card>

      {/* Present Today */}
      <Card className={isUpdating ? 'ring-2 ring-green-500/20' : ''}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">
            Present Today
            {isUpdating && <span className="ml-1 sm:ml-2 text-xs text-green-600">●</span>}
          </CardTitle>
          <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-green-600">{presentCount}</div>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
            {pendingCount > 0 ? `${pendingCount} pending` : 'All marked'}
          </p>
        </CardContent>
      </Card>

      {/* Absent Today */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Absent Today</CardTitle>
          <UserX className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 flex-shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-red-600">{absentCount}</div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {Math.round((absentCount / totalStudents) * 100)}% of class
          </p>
        </CardContent>
      </Card>

      {/* Today's Attendance Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Today's Rate</CardTitle>
          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
        </CardHeader>
        <CardContent>
          <div className={`text-xl sm:text-2xl font-bold ${getAttendanceStatusColor(overallPercentage)}`}>
            {overallPercentage}%
          </div>
          <div className="mt-2">
            <Progress
              value={overallPercentage}
              className="h-1.5 sm:h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Average Cumulative Attendance - Full width card */}
      <Card className="col-span-2 md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-sm sm:text-base font-medium flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span>Class Performance Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-4">
            <div className="text-center">
              <div className={`text-2xl sm:text-3xl font-bold ${getAttendanceStatusColor(averageCumulativeAttendance)}`}>
                {averageCumulativeAttendance}%
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Average Cumulative Attendance
              </p>
              <Progress
                value={averageCumulativeAttendance}
                className="h-1.5 sm:h-2 mt-2"
              />
            </div>

            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {presentCount}/{totalStudents}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Present Today
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span className="text-[10px] sm:text-xs">Present</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                  <span className="text-[10px] sm:text-xs">Absent</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
                  <span className="text-[10px] sm:text-xs">Pending</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {studentsWithGoodAttendance}
              </div>
              <p className="text-xs sm:text-sm  mt-1 inline">
                Students with 80%+ Attendance
              </p>
              <p className="text-xs sm:text-sm mt-1 font-bold">
                {totalStudents > 0 ? Math.round((studentsWithGoodAttendance / totalStudents) * 100) : 0}% of class
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceStats;