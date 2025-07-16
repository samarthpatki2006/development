
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Calendar, Award, TrendingUp, Clock, Target, CheckSquare } from 'lucide-react';
import StatsCard from '@/components/layout/StatsCard';
import PermissionWrapper from '@/components/PermissionWrapper';

interface TeacherDashboardProps {
  teacherData: any;
}

const TeacherDashboard = ({ teacherData }: TeacherDashboardProps) => {
  const stats = [
    {
      title: 'Courses Teaching',
      value: '4',
      icon: BookOpen,
      iconBgColor: 'bg-blue-500'
    },
    {
      title: 'Total Students',
      value: '156',
      icon: Users,
      iconBgColor: 'bg-green-500'
    },
    {
      title: 'Classes This Week',
      value: '18',
      icon: Calendar,
      iconBgColor: 'bg-purple-500'
    },
    {
      title: 'Pending Grading',
      value: '23',
      icon: CheckSquare,
      iconBgColor: 'bg-orange-500'
    }
  ];

  const upcomingClasses = [
    {
      title: 'Database Systems - CS301',
      time: '09:00 AM - 10:30 AM',
      room: 'Room 204',
      type: 'lecture'
    },
    {
      title: 'Web Development - CS401',
      time: '02:00 PM - 03:30 PM',
      room: 'Lab 1',
      type: 'practical'
    },
    {
      title: 'Data Structures - CS201',
      time: '04:00 PM - 05:30 PM',
      room: 'Room 102',
      type: 'tutorial'
    }
  ];

  const recentCourses = [
    { name: 'Database Systems', code: 'CS301', students: 42, progress: 75 },
    { name: 'Web Development', code: 'CS401', students: 38, progress: 60 },
    { name: 'Data Structures', code: 'CS201', students: 45, progress: 80 },
    { name: 'Software Engineering', code: 'CS501', students: 31, progress: 45 }
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
        {/* Teaching Performance */}
        <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">Teaching Performance</CardTitle>
            <CardDescription>Student feedback and course ratings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-br from-green-500/20 via-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Performance Analytics Chart</p>
            </div>
          </CardContent>
        </Card>

        {/* Student Progress */}
        <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">Student Progress</CardTitle>
            <CardDescription>Overall class performance trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-br from-blue-500/20 via-green-500/20 to-yellow-500/20 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Student Progress Chart</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grading Workload */}
        <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">Grading Workload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Assignments to Grade</span>
                <span className="text-sm text-card-foreground">23 pending</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Exams to Grade</span>
                <span className="text-sm text-card-foreground">8 pending</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Classes */}
        <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">Upcoming Classes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingClasses.map((classItem, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                <div className="w-2 h-2 bg-role-teacher rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-card-foreground">{classItem.title}</p>
                  <p className="text-sm text-muted-foreground">{classItem.time} • {classItem.room}</p>
                </div>
                <Badge variant="outline" className="border-role-teacher/20 text-role-teacher">
                  {classItem.type}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Teaching Courses */}
      <PermissionWrapper permission="upload_materials">
        <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">Teaching Courses</CardTitle>
            <CardDescription>Your courses this semester</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentCourses.map((course, index) => (
                <div key={index} className="p-6 border border-white/10 rounded-lg bg-white/5 hover:border-role-teacher/20 transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-card-foreground">{course.name}</h4>
                    <Badge variant="secondary" className="bg-role-teacher/10 text-role-teacher border-role-teacher/20">
                      {course.code}
                    </Badge>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Students</span>
                      <span className="text-card-foreground font-medium">{course.students}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-card-foreground font-medium">{course.progress}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-role-teacher h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${course.progress}%` }}
                    ></div>
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
