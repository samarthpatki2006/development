
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, FileText, Calendar, Award, Upload } from 'lucide-react';
import PermissionWrapper from '@/components/PermissionWrapper';

interface TeacherDashboardProps {
  teacherData: any;
}

const TeacherDashboard = ({ teacherData }: TeacherDashboardProps) => {
  const teacherStats = [
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

  const recentActivities = [
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

  const quickActions = [
    {
      title: 'Grade Assignments',
      description: 'Review and grade pending submissions',
      icon: Award,
      color: 'bg-blue-50 text-blue-600',
      permission: 'review_assignments' as const
    },
    {
      title: 'Mark Attendance',
      description: 'Record student attendance for classes',
      icon: Users,
      color: 'bg-green-50 text-green-600',
      permission: 'mark_attendance' as const
    },
    {
      title: 'Upload Materials',
      description: 'Share lecture notes and resources',
      icon: Upload,
      color: 'bg-purple-50 text-purple-600',
      permission: 'upload_materials' as const
    },
    {
      title: 'Join Discussion',
      description: 'Participate in faculty forums',
      icon: FileText,
      color: 'bg-yellow-50 text-yellow-600',
      permission: 'join_forums' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Welcome, Prof. {teacherData.first_name} {teacherData.last_name}!</span>
          </CardTitle>
          <CardDescription>
            Faculty ID: {teacherData.user_code} | Department: Computer Science
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {teacherStats.map((stat, index) => {
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
            <CardDescription>Your latest teaching activities</CardDescription>
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
            <CardDescription>Commonly used features</CardDescription>
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

      {/* Teaching Schedule */}
      <PermissionWrapper permission="mark_attendance">
        <Card>
          <CardHeader>
            <CardTitle>Today's Classes</CardTitle>
            <CardDescription>Your scheduled classes for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { course: 'Data Structures & Algorithms', time: '09:00 - 10:30', room: 'Room 301', students: 35 },
                { course: 'Database Management Systems', time: '11:00 - 12:30', room: 'Room 205', students: 42 },
                { course: 'Computer Networks', time: '14:00 - 15:30', room: 'Lab 101', students: 28 }
              ].map((class_item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{class_item.course}</h4>
                    <p className="text-sm text-gray-600">{class_item.time} • {class_item.room}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">{class_item.students} students</Badge>
                    <div className="mt-2">
                      <Button size="sm" variant="outline">
                        Mark Attendance
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </PermissionWrapper>
    </div>
  );
};

export default TeacherDashboard;
