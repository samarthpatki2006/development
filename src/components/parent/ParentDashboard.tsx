
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, BookOpen, Calendar, DollarSign, Award, AlertCircle } from 'lucide-react';
import StatsCard from '@/components/layout/StatsCard';
import PermissionWrapper from '@/components/PermissionWrapper';

interface ParentDashboardProps {
  user: any;
}

const ParentDashboard = ({ user }: ParentDashboardProps) => {
  // Mock data for children
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
      iconBgColor: 'bg-green-500'
    },
    {
      title: 'Attendance',
      value: '92%',
      icon: Calendar,
      iconBgColor: 'bg-blue-500'
    },
    {
      title: 'Pending Fees',
      value: '₹15,000',
      icon: DollarSign,
      iconBgColor: 'bg-red-500'
    },
    {
      title: 'Enrolled Courses',
      value: '6',
      icon: BookOpen,
      iconBgColor: 'bg-purple-500'
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

  return (
    <div className="space-y-6">
      {/* Children Overview */}
      <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-card-foreground">
            <User className="h-5 w-5" />
            <span>Your Children</span>
          </CardTitle>
          <CardDescription>Students linked to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {children.map((child) => (
              <div key={child.id} className="flex items-center justify-between p-4 border border-white/10 rounded-lg bg-white/5">
                <div>
                  <h4 className="font-medium text-card-foreground">{child.name}</h4>
                  <p className="text-sm text-muted-foreground">{child.user_code} • {child.class}</p>
                </div>
                <div className="flex space-x-2">
                  <PermissionWrapper permission="view_child_grades">
                    <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
                      CGPA: {child.cgpa}
                    </Badge>
                  </PermissionWrapper>
                  <PermissionWrapper permission="view_child_attendance">
                    <Badge variant="outline" className="border-blue-500/20 text-blue-400">
                      Attendance: {child.attendance}
                    </Badge>
                  </PermissionWrapper>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {childStats.map((stat, index) => (
          <PermissionWrapper key={index} permission="view_child_grades">
            <StatsCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              iconBgColor={stat.iconBgColor}
            />
          </PermissionWrapper>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">Recent Updates</CardTitle>
            <CardDescription>Latest activities for your children</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity, index) => (
              <PermissionWrapper key={index} permission={activity.permission}>
                <div className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium text-card-foreground">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-white/40 font-mono">{activity.child} • {activity.time}</p>
                  </div>
                </div>
              </PermissionWrapper>
            ))}
          </CardContent>
        </Card>

        {/* Fee Payment Alert */}
        <PermissionWrapper permission="view_child_fees">
          <Card className="border-yellow-500/20 bg-yellow-500/5 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-yellow-400">
                <AlertCircle className="h-5 w-5" />
                <span>Payment Reminder</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-300 mb-4">
                Semester fees for Alex Johnson are due in 5 days. Amount due: ₹15,000
              </p>
              <PermissionWrapper permission="make_child_payments">
                <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors">
                  Pay Now
                </button>
              </PermissionWrapper>
            </CardContent>
          </Card>
        </PermissionWrapper>
      </div>
    </div>
  );
};

export default ParentDashboard;
