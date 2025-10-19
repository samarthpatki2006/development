import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, BookOpen, Calendar, DollarSign, Award, AlertCircle } from 'lucide-react';
import PermissionWrapper from '@/components/PermissionWrapper';

interface ParentDashboardProps {
  user: any;
  onNavigate?: (tab: string) => void; // Add navigation callback
}

const ParentDashboard = ({ user, onNavigate }: ParentDashboardProps) => {
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
      permission: 'view_child_grades' as const,
      navigateTo: 'grades'
    },
    {
      title: 'Attendance',
      value: '92%',
      icon: Calendar,
      color: 'text-blue-600',
      permission: 'view_child_attendance' as const,
      navigateTo: 'attendance'
    },
    {
      title: 'Pending Fees',
      value: '₹15,000',
      icon: DollarSign,
      color: 'text-red-600',
      permission: 'view_child_fees' as const,
      navigateTo: 'payments'
    },
    {
      title: 'Enrolled Courses',
      value: '6',
      icon: BookOpen,
      color: 'text-purple-600',
      permission: 'view_child_grades' as const,
      navigateTo: 'courses'
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
      color: 'bg-green-50 text-green-600 hover:bg-green-100',
      permission: 'view_child_grades' as const,
      navigateTo: 'grades'
    },
    {
      title: 'Pay Fees',
      description: 'Make fee payments for your child',
      icon: DollarSign,
      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
      permission: 'make_child_payments' as const,
      navigateTo: 'payments'
    },
    {
      title: 'Attendance Report',
      description: 'View detailed attendance records',
      icon: Calendar,
      color: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
      permission: 'view_child_attendance' as const,
      navigateTo: 'attendance'
    },
    {
      title: 'Contact Support',
      description: 'Get help with any concerns',
      icon: AlertCircle,
      color: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100',
      permission: 'support_tickets' as const,
      navigateTo: 'support'
    }
  ];

  const handleQuickActionClick = (navigateTo: string, actionTitle: string) => {
    if (onNavigate) {
      onNavigate(navigateTo);
    } else {
      console.warn(`Navigation not available for ${actionTitle}`);
    }
  };

  const handleStatCardClick = (navigateTo: string) => {
    if (onNavigate) {
      onNavigate(navigateTo);
    }
  };

  const handleChildClick = () => {
    if (onNavigate) {
      onNavigate('grades');
    }
  };

  const handlePayNowClick = () => {
    if (onNavigate) {
      onNavigate('payments');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up px-3 sm:px-4 md:px-6 overflow-x-hidden w-full">
      {/* Welcome Section Parent Portal | Monitor your child's academic progress */}
      <div className="bg-card border border-white/10 rounded-lg p-4 sm:p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold">
                Welcome, {user.first_name} {user.last_name}!
              </h1>
              <Badge className="bg-gray-600/30 text-gray-100 border border-gray-300/40 font-bold px-4 py-1.5 w-fit hover:bg-gray-600/40 hover:border-gray-300/60 hover:cursor-pointer hover:shadow-[0_0_20px_rgba(107,114,128,0.4)] transition-all duration-300">
                PARENT
              </Badge>
            </div>
            <p className="text-sm sm:text-base">Parent Portal | Monitor your child's academic progress</p>
          </div>
        </div>
      </div>

      {/* Children Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Your Children</CardTitle>
          <CardDescription>Students linked to your account - click to view details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {children.map((child) => (
              <div
                key={child.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg transition-colors cursor-pointer hover:shadow-md"
                onClick={handleChildClick}
              >
                <div>
                  <h4 className="font-medium">{child.name}</h4>
                  <p className="text-sm">{child.user_code} • {child.class}</p>
                </div>
                <div className="flex flex-wrap gap-2">
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
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 w-ful">
        {childStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <PermissionWrapper key={index} permission={stat.permission}>
              <Card
                className="hover:shadow-md transition-all duration-300 hover:border-role-parent/20 cursor-pointer hover:scale-[1.01] sm:hover:scale-[1.03] md:hover:scale-105 will-change-transform"
                onClick={() => handleStatCardClick(stat.title)}
              >
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
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Activities */}
        <Card className="h-[450px] sm:h-[510px] border-white/20 bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-md shadow-2xl overflow-hidden group">
          <CardHeader className="sticky top-0 z-10 bg-gradient-to-b from-card/95 to-card/80 backdrop-blur-sm border-b border-white/10 pb-4">
            <CardTitle className="text-card-foreground text-lg sm:text-xl">Recent Activities</CardTitle>
            <CardDescription className="text-sm">Your latest academic activities</CardDescription>
          </CardHeader>
          <CardContent className="h-[calc(100%-100px)] overflow-y-auto overflow-x-hidden scrollbar-thin space-y-3 sm:space-y-4 p-4 sm:p-6 ">
            {recentActivities.map((activity, index) => (
              <PermissionWrapper key={index} permission={activity.permission}>
                <div key={index} className="flex flex-row items-start justify-start space-x-2 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 hover:shadow-md hover:shadow-gray-500/5 will-change-transform">
                  <div className="flex-shrink-0 mt-2 sm:mt-2.5">
                    <div className="w-2 h-2 bg-gray-400 rounded-full  animate-pulse shadow-lg shadow-gray-400/50"></div>
                  </div>
                  <div className="flex flex-col justify-center flex-1 min-w-0">
                    <p className="font-medium text-card-foreground text-sm sm:text-base truncate">{activity.title}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-snug line-clamp-2">{activity.description}</p>
                    <p className="text-[10px] sm:text-xs text-white/40 font-mono mt-1">{activity.time}</p>
                  </div>
                </div>
              </PermissionWrapper>
            ))}
          </CardContent>
        </Card>


        {/* Quick Actions */}
        <Card className="h-[450px] sm:h-[510px] border-white/20 bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-md shadow-2xl overflow-hidden group">
          <CardHeader className="sticky top-0 z-10 bg-gradient-to-b from-card/95 to-card/80 backdrop-blur-sm border-b border-white/10 pb-4">
            <CardTitle className="text-card-foreground text-lg sm:text-xl">Quick Actions</CardTitle>
            <CardDescription className="text-sm">Frequently used features - click to navigate</CardDescription>
          </CardHeader>
          <CardContent className="h-[calc(100%-100px)] overflow-y-auto overflow-x-hidden scroll-smooth space-y-3 sm:space-y-4 p-4 sm:p-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <PermissionWrapper key={index} permission={action.permission}>
                  <div key={index} className="flex flex-row items-start justify-start space-x-4 p-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 hover:shadow-md hover:shadow-gray-500/5 will-change-transform"
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
            })}
          </CardContent>
        </Card>
      </div>

      {/* Fee Payment Alert */}
      <PermissionWrapper permission="view_child_fees">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-base sm:text-lg">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-blue-600 dark:text-blue-500" />
              <span>Payment Reminder</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm sm:text-base">
              Semester fees for Alex Johnson are due in 5 days. Amount due: ₹15,000
            </p>
            <PermissionWrapper permission="make_child_payments">
              <Button
                onClick={handlePayNowClick}
                className="w-full sm:w-auto"
              >
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