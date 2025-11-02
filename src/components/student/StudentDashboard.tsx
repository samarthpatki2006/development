import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, DollarSign, Award, Home, Users } from 'lucide-react';
import PermissionWrapper from '@/components/PermissionWrapper';

interface StudentDashboardProps {
  studentData: any;
  onNavigate?: (tab: string) => void; // Add navigation callback
}

const StudentDashboard = ({ studentData, onNavigate }: StudentDashboardProps) => {
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
      color: 'text-purple-600',
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
      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
      permission: 'view_submit_assignments' as const,
      navigateTo: 'courses' // Maps to CoursesLearningSnapshot
    },
    {
      title: 'Apply for Hostel',
      description: 'Submit hostel accommodation request',
      icon: Home,
      color: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
      permission: 'apply_hostel' as const,
      navigateTo: 'hostel' // Maps to HostelFacility
    },
    {
      title: 'Join Discussion',
      description: 'Participate in course forums',
      icon: Users,
      color: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
      permission: 'join_forums' as const,
      navigateTo: 'communication' // Maps to CommunicationCenter
    },
    {
      title: 'Request Certificate',
      description: 'Apply for academic certificates',
      icon: Award,
      color: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100',
      permission: 'request_certificates' as const,
      navigateTo: 'support' // Maps to SupportHelp
    }
  ];

  const handleQuickActionClick = (navigateTo: string, actionTitle: string) => {
    if (onNavigate) {
      onNavigate(navigateTo);
    } else {
      console.warn(`Navigation not available for ${actionTitle}`);
    }
  };

  const handleStatCardClick = (statTitle: string) => {
    if (onNavigate) {
      switch (statTitle) {
        case 'Enrolled Courses':
          onNavigate('courses');
          break;
        case 'Upcoming Assignments':
          onNavigate('courses');
          break;
        case 'Current CGPA':
          onNavigate('gradebook');
          break;
        case 'Pending Fees':
          onNavigate('payments');
          break;
        default:
          break;
      }
    }
  };

  const handleCourseClick = () => {
    if (onNavigate) {
      onNavigate('courses');
    }
  };

  return (
    <div className="animate-fade-in-up space-y-4 sm:space-y-6 px-2 sm:px-0 overflow-x-hidden bg-black">
      {/* Welcome Section */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-md p-4 sm:p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold mb-2 inline-block">
              Welcome back,
              {studentData.first_name}
            </h1>
            <p >Student ID: {studentData.user_code}</p>
            <Badge className="bg-green-600/30 text-green-100 border border-green-300/40 font-bold px-4 py-1.5 self-start md:self-auto hover:bg-green-600/40 hover:border-green-300/60 hover:cursor-pointer hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all duration-300 mt-4">
              STUDENT
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-md">Current CGPA</p>
            <p className="text-2xl font-bold text-role-student">8.5</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 w-full">

        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <PermissionWrapper key={index} permission={stat.permission}>
              <Card
                className="bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-role-student/20 cursor-pointer hover-translate-up"
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
        <Card className="h-[450px] sm:h-[510px] border-white/20 bg-gradient-to-br from-card/60 to-card/40 overflow-hidden pb-2">
          <CardHeader className="sticky top-0 z-10 bg-neutral-800 border-b border-white/10 pb-4">
            <CardTitle className="text-card-foreground text-lg sm:text-xl">Recent Activities</CardTitle>
            <CardDescription className="text-sm">Your latest academic activities</CardDescription>
          </CardHeader>
          <CardContent className="h-[calc(100%-100px)] custom-scrollbar overflow-x-hidden  space-y-3 sm:space-y-4 p-4 sm:p-6  ">
            {recentActivities.map((activity, index) => (
              <PermissionWrapper key={index} permission={activity.permission}>
                <div key={index} className="flex flex-row items-start justify-start space-x-2 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 hover:shadow-sm hover:shadow-green-500/5 will-change-transform">
                  <div className="flex-shrink-0 mt-2 sm:mt-2.5">
                    <div className="w-2 h-2 bg-green-400 rounded-full  animate-pulse shadow-lg shadow-green-400/50"></div>
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
        <Card className="h-[450px] sm:h-[510px] border-white/20 bg-gradient-to-br from-card/60 to-card/40 overflow-hidden">
          <CardHeader className="sticky top-0 z-10 bg-gradient-to-b from-card/95 to-card/80 backdrop-blur-sm bg-neutral-800 border-b border-white/10 pb-4">
            <CardTitle className="text-card-foreground text-lg sm:text-xl">Quick Actions</CardTitle>
            <CardDescription className="text-sm">Frequently used features - click to navigate</CardDescription>
          </CardHeader>
          <CardContent className="h-[calc(100%-100px)] overflow-y-auto overflow-x-hidden custom-scrollbar space-y-3 sm:space-y-4 p-4 sm:p-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <PermissionWrapper key={index} permission={action.permission}>
                  <div key={index} className="flex flex-row items-start justify-start space-x-4 p-4 rounded-lg border border-white/10 bg-white/5 hover:border-green-400/40 hover:bg-white/10 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10 hover:-translate-y-0.5 will-change-transform"
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

      {/* Current Courses Preview */}
      <PermissionWrapper permission="view_submit_assignments">
        <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-bold text-card-foreground">Current Courses</CardTitle>
            <CardDescription>Your enrolled courses this semester - click to view details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-h-[300px] overflow-y-auto custom-scrollbar">
              {[
                { name: 'Data Structures & Algorithms', code: 'CS301', instructor: 'Dr. Smith', progress: 75 },
                { name: 'Database Management Systems', code: 'CS302', instructor: 'Dr. Johnson', progress: 60 },
                { name: 'Computer Networks', code: 'CS303', instructor: 'Dr. Brown', progress: 80 }
              ].map((course, index) => (
                <div
                  key={index}
                  className="p-6 border border-white/10 rounded-lg bg-white/5 hover:border-role-student/20 transition-all duration-300 hover-translate-up cursor-pointer hover:scale-[1.02] sm:hover:scale-105"
                  onClick={handleCourseClick}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-card-foreground">{course.name}</h4>
                    <Badge variant="secondary">{course.code}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{course.instructor}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-card-foreground font-medium">{course.progress}%</span>
                    </div>
                    <div className="w-full  rounded-full h-2">
                      <div
                        className=" h-2 rounded-full transition-all duration-500"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Button
                variant="outline"
                onClick={handleCourseClick}
                className="mt-8 hover:bg-role-student/10 hover:text-role-student hover:border-role-student/20 will-change-transform"
              >
                View All Courses
              </Button>
            </div>
          </CardContent>
        </Card>
      </PermissionWrapper>
    </div>
  );
};

export default StudentDashboard;