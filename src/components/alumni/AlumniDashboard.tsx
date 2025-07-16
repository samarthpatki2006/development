
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GraduationCap, Heart, Calendar, Users, Award, MessageSquare, TrendingUp, Target } from 'lucide-react';
import StatsCard from '@/components/layout/StatsCard';
import PermissionWrapper from '@/components/PermissionWrapper';

interface AlumniDashboardProps {
  user: any;
}

const AlumniDashboard = ({ user }: AlumniDashboardProps) => {
  const alumniStats = [
    {
      title: 'Years Since Graduation',
      value: '5',
      icon: GraduationCap,
      iconBgColor: 'bg-role-alumni'
    },
    {
      title: 'Total Contributions',
      value: '₹50,000',
      icon: Heart,
      iconBgColor: 'bg-red-500'
    },
    {
      title: 'Events Attended',
      value: '12',
      icon: Calendar,
      iconBgColor: 'bg-green-500'
    },
    {
      title: 'Network Connections',
      value: '45',
      icon: Users,
      iconBgColor: 'bg-purple-500'
    }
  ];

  const recentActivities = [
    {
      title: 'Contribution Made',
      description: 'Donated ₹10,000 to scholarship fund',
      time: '1 week ago',
      permission: 'alumni_contributions' as const
    },
    {
      title: 'Event Registered',
      description: 'Annual Alumni Meet 2024',
      time: '2 weeks ago',
      permission: 'alumni_events' as const
    },
    {
      title: 'Forum Post',
      description: 'Shared career advice in CS forum',
      time: '3 weeks ago',
      permission: 'join_forums' as const
    },
    {
      title: 'Certificate Requested',
      description: 'Applied for degree verification',
      time: '1 month ago',
      permission: 'request_certificates' as const
    }
  ];

  const quickActions = [
    {
      title: 'Make Contribution',
      description: 'Support current students and college',
      icon: Heart,
      permission: 'alumni_contributions' as const
    },
    {
      title: 'Alumni Events',
      description: 'View and register for upcoming events',
      icon: Calendar,
      permission: 'alumni_events' as const
    },
    {
      title: 'Join Discussion',
      description: 'Connect with fellow alumni',
      icon: MessageSquare,
      permission: 'join_forums' as const
    },
    {
      title: 'Request Certificate',
      description: 'Apply for academic documents',
      icon: Award,
      permission: 'request_certificates' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-card-foreground">
            <GraduationCap className="h-6 w-6 text-role-alumni" />
            <span>Welcome back, {user.first_name} {user.last_name}!</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Alumni ID: {user.user_code} | Class of 2019 | Computer Science
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {alumniStats.map((stat, index) => (
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
        {/* Alumni Impact */}
        <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">Alumni Impact</CardTitle>
            <CardDescription>Your contribution impact over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-br from-role-alumni/20 via-red-500/20 to-green-500/20 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Impact Analytics Chart</p>
            </div>
          </CardContent>
        </Card>

        {/* Network Growth */}
        <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">Network Growth</CardTitle>
            <CardDescription>Your alumni connections and engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-role-alumni/20 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Network Analytics Chart</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contribution Progress */}
        <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">Contribution Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Annual Goal</span>
                <span className="text-sm text-card-foreground">₹50,000 / ₹100,000</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-gradient-to-r from-role-alumni to-red-500 h-2 rounded-full" style={{ width: '50%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Students Helped</span>
                <span className="text-sm text-card-foreground">5 this year</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-gradient-to-r from-green-500 to-role-alumni h-2 rounded-full" style={{ width: '83%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">Recent Activities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivities.map((activity, index) => (
              <PermissionWrapper key={index} permission={activity.permission}>
                <div className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg">
                  <div className="w-2 h-2 bg-role-alumni rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium text-card-foreground">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-white/40 font-mono">{activity.time}</p>
                  </div>
                </div>
              </PermissionWrapper>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-card-foreground">Quick Actions</CardTitle>
          <CardDescription>Connect and contribute to your alma mater</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <PermissionWrapper key={index} permission={action.permission}>
                  <div className="flex flex-col items-center space-y-3 p-6 border border-white/10 rounded-lg bg-white/5 hover:border-role-alumni/20 hover:bg-white/10 cursor-pointer transition-all duration-300">
                    <div className="p-3 rounded-lg bg-role-alumni/10">
                      <Icon className="h-6 w-6 text-role-alumni" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-card-foreground">{action.title}</p>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                </PermissionWrapper>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Contribution Impact */}
      <PermissionWrapper permission="alumni_contributions">
        <Card className="border-role-alumni/20 bg-role-alumni/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-role-alumni">
              <Heart className="h-5 w-5" />
              <span>Your Impact</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-card-foreground mb-4">
              Your contributions have helped 5 students with scholarships this year. Thank you for giving back!
            </p>
            <Button className="bg-role-alumni hover:bg-role-alumni/90 text-white">
              Make Another Contribution
            </Button>
          </CardContent>
        </Card>
      </PermissionWrapper>
    </div>
  );
};

export default AlumniDashboard;
