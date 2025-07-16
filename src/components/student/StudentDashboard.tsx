
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, DollarSign, Award, Users, TrendingUp, Clock, Target } from 'lucide-react';
import StatsCard from '@/components/layout/StatsCard';
import PermissionWrapper from '@/components/PermissionWrapper';

interface StudentDashboardProps {
  studentData: any;
}

const StudentDashboard = ({ studentData }: StudentDashboardProps) => {
  const stats = [
    {
      title: 'Enrolled Courses',
      value: '6',
      icon: BookOpen,
      iconBgColor: 'bg-blue-500'
    },
    {
      title: 'Study Groups',
      value: '4',
      icon: Users,
      iconBgColor: 'bg-green-500'
    },
    {
      title: 'Study Hours',
      value: '24',
      icon: Clock,
      iconBgColor: 'bg-purple-500'
    },
    {
      title: 'Achievements',
      value: '12',
      icon: Award,
      iconBgColor: 'bg-yellow-500'
    }
  ];

  const upcomingDeadlines = [
    {
      title: 'CS101 Assignment',
      description: 'Tomorrow',
      type: 'assignment'
    },
    {
      title: 'Group Project Meeting',
      description: 'In 2 days',
      type: 'meeting'
    },
    {
      title: 'Math Quiz',
      description: 'Next Week',
      type: 'quiz'
    }
  ];

  const recentCourses = [
    { name: 'Data Structures & Algorithms', code: 'CS301', progress: 75 },
    { name: 'Database Management Systems', code: 'CS302', progress: 60 },
    { name: 'Computer Networks', code: 'CS303', progress: 80 }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            iconBgColor={stat.iconBgColor}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Academic Performance */}
        <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">Academic Performance</CardTitle>
            <CardDescription>Your progress over time</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for chart - you can add recharts here */}
            <div className="h-64 bg-gradient-to-br from-green-500/20 via-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Academic Performance Chart</p>
            </div>
          </CardContent>
        </Card>

        {/* Study Patterns */}
        <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">Study Patterns</CardTitle>
            <CardDescription>Your study habits analysis</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for study patterns chart */}
            <div className="h-64 bg-gradient-to-br from-blue-500/20 via-green-500/20 to-yellow-500/20 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Study Patterns Chart</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Utilization */}
        <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">Resource Utilization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Last Month</span>
                <span className="text-sm text-card-foreground">75% Resources Used</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">This Month</span>
                <span className="text-sm text-card-foreground">85% Resources Used</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingDeadlines.map((deadline, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                <div className="w-2 h-2 bg-role-student rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-card-foreground">{deadline.title}</p>
                  <p className="text-sm text-muted-foreground">{deadline.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Current Courses */}
      <PermissionWrapper permission="view_submit_assignments">
        <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">Current Courses</CardTitle>
            <CardDescription>Your enrolled courses this semester</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentCourses.map((course, index) => (
                <div key={index} className="p-6 border border-white/10 rounded-lg bg-white/5 hover:border-role-student/20 transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-card-foreground">{course.name}</h4>
                    <Badge variant="secondary" className="bg-role-student/10 text-role-student border-role-student/20">
                      {course.code}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-card-foreground font-medium">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-role-student h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${course.progress}%` }}
                      ></div>
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

export default StudentDashboard;
