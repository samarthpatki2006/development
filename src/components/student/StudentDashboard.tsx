
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, DollarSign, Award, Home, Users } from 'lucide-react';
import PermissionWrapper from '@/components/PermissionWrapper';

interface StudentDashboardProps {
  studentData: any;
}

const StudentDashboard = ({ studentData }: StudentDashboardProps) => {
  const quickStats = [
    {
      title: 'Enrolled Courses',
      value: '6',
      icon: BookOpen,
      color: 'text-blue-600',
      permission: 'view_submit_assignments' as const
    },
    {
      title: 'Upcoming Assignments',
      value: '3',
      icon: Calendar,
      color: 'text-orange-600',
      permission: 'view_submit_assignments' as const
    },
    {
      title: 'Current CGPA',
      value: '8.5',
      icon: Award,
      color: 'text-green-600',
      permission: 'view_grades' as const
    },
    {
      title: 'Pending Fees',
      value: '₹15,000',
      icon: DollarSign,
      color: 'text-red-600',
      permission: 'view_fees' as const
    }
  ];

  const recentActivities = [
    {
      title: 'Assignment Submitted',
      description: 'Data Structures - Binary Trees',
      time: '2 hours ago',
      type: 'assignment',
      permission: 'view_submit_assignments' as const
    },
    {
      title: 'Grade Updated',
      description: 'Computer Networks - A Grade',
      time: '1 day ago',
      type: 'grade',
      permission: 'view_grades' as const
    },
    {
      title: 'Attendance Marked',
      description: 'Database Management Systems',
      time: '2 days ago',
      type: 'attendance',
      permission: 'view_attendance' as const
    },
    {
      title: 'Fee Payment Due',
      description: 'Semester Fee - Due in 5 days',
      time: '3 days ago',
      type: 'fee',
      permission: 'view_fees' as const
    }
  ];

  const quickActions = [
    {
      title: 'View Assignments',
      description: 'Check and submit pending assignments',
      icon: BookOpen,
      color: 'bg-blue-50 text-blue-600',
      permission: 'view_submit_assignments' as const
    },
    {
      title: 'Apply for Hostel',
      description: 'Submit hostel accommodation request',
      icon: Home,
      color: 'bg-green-50 text-green-600',
      permission: 'apply_hostel' as const
    },
    {
      title: 'Join Discussion',
      description: 'Participate in course forums',
      icon: Users,
      color: 'bg-purple-50 text-purple-600',
      permission: 'join_forums' as const
    },
    {
      title: 'Request Certificate',
      description: 'Apply for academic certificates',
      icon: Award,
      color: 'bg-yellow-50 text-yellow-600',
      permission: 'request_certificates' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Welcome back, {studentData.first_name}!</span>
          </CardTitle>
          <CardDescription>
            Student ID: {studentData.user_code} | Current Semester: Fall 2024
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <PermissionWrapper key={index} permission={stat.permission}>
              <Card>
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
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Your latest academic activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity, index) => (
              <PermissionWrapper key={index} permission={activity.permission}>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                </div>
              </PermissionWrapper>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <PermissionWrapper key={index} permission={action.permission}>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                    <div className={`p-2 rounded-lg ${action.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{action.title}</p>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                  </div>
                </PermissionWrapper>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Current Courses Preview */}
      <PermissionWrapper permission="view_submit_assignments">
        <Card>
          <CardHeader>
            <CardTitle>Current Courses</CardTitle>
            <CardDescription>Your enrolled courses this semester</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Data Structures & Algorithms', code: 'CS301', instructor: 'Dr. Smith', progress: 75 },
                { name: 'Database Management Systems', code: 'CS302', instructor: 'Dr. Johnson', progress: 60 },
                { name: 'Computer Networks', code: 'CS303', instructor: 'Dr. Brown', progress: 80 }
              ].map((course, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{course.name}</h4>
                    <Badge variant="secondary">{course.code}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{course.instructor}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{course.progress}% Complete</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </PermissionWrapper>
    </div>
  );
};

export default StudentDashboard;
