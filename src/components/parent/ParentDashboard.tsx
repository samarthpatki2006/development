
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, BookOpen, Calendar, DollarSign, Award, AlertCircle } from 'lucide-react';
import PermissionWrapper from '@/components/PermissionWrapper';

interface ParentDashboardProps {
  user: any;
}

const ParentDashboard = ({ user }: ParentDashboardProps) => {
  // Mock data for children - in real app, this would come from parent_student_links
  const children = [
    {
      id: 1,
      name: 'Alex Johnson',
      user_code: 'IIMBS240001',
      class: 'Computer Science - Semester 6',
      cgpa: '8.5',
      attendance: '92%'
    }
  ];

  const childStats = [
    {
      title: 'Current CGPA',
      value: '8.5',
      icon: Award,
      color: 'text-green-600',
      permission: 'view_child_grades' as const
    },
    {
      title: 'Attendance',
      value: '92%',
      icon: Calendar,
      color: 'text-blue-600',
      permission: 'view_child_attendance' as const
    },
    {
      title: 'Pending Fees',
      value: '₹15,000',
      icon: DollarSign,
      color: 'text-red-600',
      permission: 'view_child_fees' as const
    },
    {
      title: 'Enrolled Courses',
      value: '6',
      icon: BookOpen,
      color: 'text-purple-600',
      permission: 'view_child_grades' as const
    }
  ];

  const recentActivities = [
    {
      title: 'Grade Updated',
      description: 'Computer Networks - A Grade received',
      time: '1 day ago',
      child: 'Alex Johnson',
      permission: 'view_child_grades' as const
    },
    {
      title: 'Fee Payment Due',
      description: 'Semester Fee - Due in 5 days',
      time: '2 days ago',
      child: 'Alex Johnson',
      permission: 'view_child_fees' as const
    },
    {
      title: 'Attendance Alert',
      description: 'Missed Database Management class',
      time: '3 days ago',
      child: 'Alex Johnson',
      permission: 'view_child_attendance' as const
    }
  ];

  const quickActions = [
    {
      title: 'View Grades',
      description: 'Check your child\'s academic performance',
      icon: Award,
      color: 'bg-green-50 text-green-600',
      permission: 'view_child_grades' as const
    },
    {
      title: 'Pay Fees',
      description: 'Make fee payments for your child',
      icon: DollarSign,
      color: 'bg-blue-50 text-blue-600',
      permission: 'make_child_payments' as const
    },
    {
      title: 'Attendance Report',
      description: 'View detailed attendance records',
      icon: Calendar,
      color: 'bg-purple-50 text-purple-600',
      permission: 'view_child_attendance' as const
    },
    {
      title: 'Contact Support',
      description: 'Get help with any concerns',
      icon: AlertCircle,
      color: 'bg-yellow-50 text-yellow-600',
      permission: 'support_tickets' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Welcome, {user.first_name} {user.last_name}!</span>
          </CardTitle>
          <CardDescription>
            Parent Portal | Monitor your child's academic progress
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Children Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Your Children</CardTitle>
          <CardDescription>Students linked to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {children.map((child) => (
              <div key={child.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{child.name}</h4>
                  <p className="text-sm text-gray-600">{child.user_code} • {child.class}</p>
                </div>
                <div className="flex space-x-2">
                  <PermissionWrapper permission="view_child_grades">
                    <Badge variant="secondary">CGPA: {child.cgpa}</Badge>
                  </PermissionWrapper>
                  <PermissionWrapper permission="view_child_attendance">
                    <Badge variant="outline">Attendance: {child.attendance}</Badge>
                  </PermissionWrapper>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {childStats.map((stat, index) => {
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
            <CardTitle>Recent Updates</CardTitle>
            <CardDescription>Latest activities for your children</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity, index) => (
              <PermissionWrapper key={index} permission={activity.permission}>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    <p className="text-xs text-gray-400">{activity.child} • {activity.time}</p>
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

      {/* Fee Payment Alert */}
      <PermissionWrapper permission="view_child_fees">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              <span>Payment Reminder</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 mb-4">
              Semester fees for Alex Johnson are due in 5 days. Amount due: ₹15,000
            </p>
            <PermissionWrapper permission="make_child_payments">
              <Button className="bg-yellow-600 hover:bg-yellow-700">
                Pay Now
              </Button>
            </PermissionWrapper>
          </CardContent>
        </Card>
      </PermissionWrapper>
    </div>
  );
};

export default ParentDashboard;
