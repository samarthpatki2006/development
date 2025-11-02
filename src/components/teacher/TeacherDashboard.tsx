import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, FileText, Calendar, Award, Upload } from 'lucide-react';
import PermissionWrapper from '@/components/PermissionWrapper';

interface TeacherDashboardProps {
  teacherData: any;
  onNavigate?: (tab: string) => void; // Add navigation callback
}

// Dashboard statistics configuration
const TEACHER_STATS = [
  {
    title: 'Courses Teaching',
    value: '4',
    icon: BookOpen,
    color: 'text-blue-600',
    permission: 'review_assignments' as const
  },
  {
    title: 'Total Students',
    value: '120',
    icon: Users,
    color: 'text-green-600',
    permission: 'view_attendance' as const
  },
  {
    title: 'Pending Assignments',
    value: '8',
    icon: FileText,
    color: 'text-orange-600',
    permission: 'review_assignments' as const
  },
  {
    title: 'Classes This Week',
    value: '12',
    icon: Calendar,
    color: 'text-purple-600',
    permission: 'mark_attendance' as const
  }
];

// Recent activities configuration
const RECENT_ACTIVITIES = [
  {
    title: 'Assignment Graded',
    description: 'Data Structures - 15 submissions reviewed',
    time: '1 hour ago',
    permission: 'review_assignments' as const
  },
  {
    title: 'Attendance Marked',
    description: 'Computer Networks - 30 students present',
    time: '3 hours ago',
    permission: 'mark_attendance' as const
  },
  {
    title: 'Material Uploaded',
    description: 'Database Systems - Lecture slides added',
    time: '1 day ago',
    permission: 'upload_materials' as const
  },
  {
    title: 'Grade Updated',
    description: 'Midterm scores published for CS301',
    time: '2 days ago',
    permission: 'assign_grades' as const
  }
];

// Quick actions configuration with navigation targets
const QUICK_ACTIONS = [
  {
    title: 'Grade Assignments',
    description: 'Review and grade pending submissions',
    icon: Award,
    color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    permission: 'review_assignments' as const,
    navigateTo: 'gradebook' // Maps to GradeManager.tsx
  },
  {
    title: 'Mark Attendance',
    description: 'Record student attendance for classes',
    icon: Users,
    color: 'bg-green-50 text-green-600 hover:bg-green-100',
    permission: 'mark_attendance' as const,
    navigateTo: 'attendance-tracking' // Maps to AttendanceTracking/AttendanceTracking.tsx
  },
  {
    title: 'Upload Materials',
    description: 'Share lecture notes and resources',
    icon: Upload,
    color: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
    permission: 'upload_materials' as const,
    navigateTo: 'courses' // Maps to TeacherCourses.tsx
  },
  {
    title: 'Join Discussion',
    description: 'Participate in teacher forums',
    icon: FileText,
    color: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100',
    permission: 'join_forums' as const,
    navigateTo: 'communication' // Maps to TeacherCommunication.tsx
  }
];

// Today's classes data
const TODAY_CLASSES = [
  { course: 'Data Structures & Algorithms', time: '09:00 - 10:30', room: 'Room 301', students: 35 },
  { course: 'Database Management Systems', time: '11:00 - 12:30', room: 'Room 205', students: 42 },
  { course: 'Computer Networks', time: '14:00 - 15:30', room: 'Lab 101', students: 28 }
];

const TeacherDashboard = ({ teacherData, onNavigate }: TeacherDashboardProps) => {
  const handleQuickActionClick = (navigateTo: string, actionTitle: string) => {
    if (onNavigate) {
      onNavigate(navigateTo);
    } else {
      console.warn(`Navigation not available for ${actionTitle}`);
    }
  };

  const handleAttendanceClick = () => {
    if (onNavigate) {
      onNavigate('attendance-tracking');
    } else {
      console.warn('Navigation not available for attendance');
    }
  };

  const renderStatCard = (stat: typeof TEACHER_STATS[0], index: number) => {
    const Icon = stat.icon;
    return (
      <PermissionWrapper key={index} permission={stat.permission}>
        <Card className="bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-role-teacher/20 cursor-pointer hover-translate-up">
          <CardContent className="p-3 sm:p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate mb-1">{stat.title}</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground truncate">{stat.value}</p>
              </div>
              <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ml-3`}>
                <Icon className={`h-5 w-5 sm:h-6 ${stat.color} sm:w-6`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </PermissionWrapper>
    );
  };

  const renderActivity = (activity: typeof RECENT_ACTIVITIES[0], index: number) => (
    <PermissionWrapper key={index} permission={activity.permission}>
      <div className="flex flex-row items-start justify-start space-x-2 p-3 rounded-lg border border-white/10 hover:border-blue-400/40 hover:bg-white/10 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5 will-change-transform">
        <div className="flex-shrink-0 mt-2 sm:mt-2.5">
          <div className="w-2 h-2 bg-blue-400 rounded-full  animate-pulse shadow-lg shadow-blue-400/50"></div>
        </div>
        <div className="flex flex-col justify-center flex-1 min-w-0">
          <p className="font-medium text-card-foreground text-sm sm:text-base truncate">{activity.title}</p>
          <p className="text-xs sm:text-sm text-muted-foreground leading-snug line-clamp-2">{activity.description}</p>
          <p className="text-[10px] sm:text-xs text-white/40 font-mono mt-1">{activity.time}</p>
        </div>
      </div>
    </PermissionWrapper>
  );

  const renderQuickAction = (action: typeof QUICK_ACTIONS[0], index: number) => {
    const Icon = action.icon;
    return (
      <PermissionWrapper key={index} permission={action.permission}>
        <div
          className="flex flex-row items-center justify-start space-x-4 p-4 rounded-lg border border-white/10 hover:border-blue-400/40 hover:bg-white/10 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5 will-change-transform"
          onClick={() => handleQuickActionClick(action.navigateTo, action.title)}
        >

          <div className={`flex-shrink-0 p-2  ${action.color} transition-colors flex items-start self-start mt-1 mr-2`}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 " />
          </div>
          <div className="flex flex-col justify-center flex-1 min-w-0">
            <p className="font-medium text-card-foreground text-sm sm:text-base truncate">{action.title}</p>
            <p className="text-xs sm:text-sm text-muted-foreground leading-snug line-clamp-2">{action.description}</p>
          </div>
        </div>
      </PermissionWrapper>
    );
  };

  const renderClassItem = (classItem: typeof TODAY_CLASSES[0], index: number) => (
    <div key={index} className="flex items-center justify-between p-4 border rounded-lg  transition-colors">
      <div>
        <h4 className="font-medium">{classItem.course}</h4>
        <p className="text-sm ">{classItem.time} • {classItem.room}</p>
      </div>
      <div className="text-right">
        <Badge variant="secondary">{classItem.students} students</Badge>
        <div className="mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAttendanceClick}
            className="hover:bg-role-teacher/10 hover:text-role-teacher hover:border-role-teacher/20 will-change-transform"
          >
            Mark Attendance
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in-up space-y-6 bg-black">
      {/* Welcome Section */}
      <Card className="border-0 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 ">
            <span>Welcome, Prof. {teacherData.first_name} {teacherData.last_name}!</span>
          </CardTitle>
          <CardDescription className="">
            Teacher ID: {teacherData.user_code} | Department: Computer Science
          </CardDescription>
          <Badge className="bg-blue-600/30 text-blue-100 border border-blue-300/40 font-bold px-5 py-1.5 w-fit self-start md:self-auto rounded-full hover:bg-blue-600/40 hover:border-blue-300/60 hover:cursor-pointer hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all duration-300 mt-4">
            FACULTY
          </Badge>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TEACHER_STATS.map(renderStatCard)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card className="h-[450px] sm:h-[510px] border-white/20 bg-gradient-to-br from-card/60 to-card/40 overflow-hidden pb-2">
          <CardHeader className="sticky top-0 z-10 bg-neutral-800 border-b border-white/10 pb-4">
            <CardTitle className="text-card-foreground text-lg sm:text-xl">Recent Activities</CardTitle>
            <CardDescription className="text-sm">Your latest teaching activities</CardDescription>
          </CardHeader>
          <CardContent className="h-[calc(100%-100px)] custom-scrollbar overflow-x-hidden  space-y-3 sm:space-y-4 p-4 sm:p-6  ">
            {RECENT_ACTIVITIES.map(renderActivity)}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="h-[450px] sm:h-[510px] border-white/20 bg-gradient-to-br from-card/60 to-card/40 overflow-hidden">
          <CardHeader className="sticky top-0 z-10 bg-gradient-to-b from-card/95 to-card/80 backdrop-blur-sm bg-neutral-800 border-b border-white/10 pb-4">
            <CardTitle className="text-card-foreground text-lg sm:text-xl">Quick Actions</CardTitle>
            <CardDescription className="text-sm">Commonly used features - click to navigate</CardDescription>
          </CardHeader>
          <CardContent className="h-[calc(100%-100px)] custom-scrollbar overflow-x-hidden  space-y-3 sm:space-y-4 p-4 sm:p-6  ">
            {QUICK_ACTIONS.map(renderQuickAction)}
          </CardContent>
        </Card>
      </div>

      {/* Teaching Schedule */}
      <PermissionWrapper permission="mark_attendance">
        <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center space-x-2">Today's Classes</CardTitle>
            <CardDescription>Your scheduled classes for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {TODAY_CLASSES.map(renderClassItem)}
            </div>
          </CardContent>
        </Card>
      </PermissionWrapper>
    </div>
  );
};

export default TeacherDashboard;