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
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <Icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </CardContent>
        </Card>
      </PermissionWrapper>
    );
  };

  const renderActivity = (activity: typeof RECENT_ACTIVITIES[0], index: number) => (
    <PermissionWrapper key={index} permission={activity.permission}>
      <div className="flex items-start space-x-3 py-2">
        <div className="w-2 h-2  rounded-full mt-2" />
        <div className="flex-1">
          <p className="font-medium text-sm">{activity.title}</p>
          <p className="text-sm ">{activity.description}</p>
          <p className="text-xs  mt-1">{activity.time}</p>
        </div>
      </div>
    </PermissionWrapper>
  );

  const renderQuickAction = (action: typeof QUICK_ACTIONS[0], index: number) => {
    const Icon = action.icon;
    return (
      <PermissionWrapper key={index} permission={action.permission}>
        <Button
          variant="ghost"
          className="w-full h-auto p-4 flex items-center justify-start space-x-3 rounded-lg border transition-all duration-200"
          onClick={() => handleQuickActionClick(action.navigateTo, action.title)}
        >
          <div className="p-2 rounded-lg ">
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-sm">{action.title}</p>
            <p className="text-xs opacity-80">{action.description}</p>
          </div>
        </Button>
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
            className=" transition-colors"
          >
            Mark Attendance
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card >
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 ">
            <span>Welcome, Prof. {teacherData.first_name} {teacherData.last_name}!</span>
          </CardTitle>
          <CardDescription className="">
            Teacher ID: {teacherData.user_code} | Department: Computer Science
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TEACHER_STATS.map(renderStatCard)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Your latest teaching activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {RECENT_ACTIVITIES.map(renderActivity)}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Commonly used features - click to navigate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {QUICK_ACTIONS.map(renderQuickAction)}
          </CardContent>
        </Card>
      </div>

      {/* Teaching Schedule */}
      <PermissionWrapper permission="mark_attendance">
        <Card>
          <CardHeader>
            <CardTitle>Today's Classes</CardTitle>
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