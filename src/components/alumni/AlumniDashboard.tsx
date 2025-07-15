
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GraduationCap, Heart, Calendar, Users, Award, MessageSquare } from 'lucide-react';
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
      color: 'text-role-alumni',
      permission: 'view_personal_dashboard' as const
    },
    {
      title: 'Total Contributions',
      value: '₹50,000',
      icon: Heart,
      color: 'text-red-600',
      permission: 'alumni_contributions' as const
    },
    {
      title: 'Events Attended',
      value: '12',
      icon: Calendar,
      color: 'text-green-600',
      permission: 'alumni_events' as const
    },
    {
      title: 'Network Connections',
      value: '45',
      icon: Users,
      color: 'text-purple-600',
      permission: 'join_forums' as const
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
      color: 'bg-red-50 text-red-600',
      permission: 'alumni_contributions' as const
    },
    {
      title: 'Alumni Events',
      description: 'View and register for upcoming events',
      icon: Calendar,
      color: 'bg-green-50 text-green-600',
      permission: 'alumni_events' as const
    },
    {
      title: 'Join Discussion',
      description: 'Connect with fellow alumni',
      icon: MessageSquare,
      color: 'bg-blue-50 text-blue-600',
      permission: 'join_forums' as const
    },
    {
      title: 'Request Certificate',
      description: 'Apply for academic documents',
      icon: Award,
      color: 'bg-yellow-50 text-yellow-600',
      permission: 'request_certificates' as const
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {alumniStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <PermissionWrapper key={index} permission={stat.permission}>
              <Card className="border-white/10 bg-card/50 backdrop-blur-sm hover:border-role-alumni/20 transition-all duration-300 hover-translate-up">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-role-alumni/10">
                      <Icon className="h-6 w-6 text-role-alumni" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </PermissionWrapper>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">Recent Activities</CardTitle>
            <CardDescription>Your latest alumni activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity, index) => (
              <PermissionWrapper key={index} permission={activity.permission}>
                <div className="flex items-start space-x-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-300">
                  <div className="w-2 h-2 bg-role-alumni rounded-full mt-3 animate-pulse-indicator"></div>
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

        {/* Quick Actions */}
        <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">Quick Actions</CardTitle>
            <CardDescription>Connect and contribute to your alma mater</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <PermissionWrapper key={index} permission={action.permission}>
                  <div className="flex items-center space-x-4 p-4 rounded-lg border border-white/10 hover:border-role-alumni/20 hover:bg-white/5 cursor-pointer transition-all duration-300 hover-translate-up">
                    <div className="p-3 rounded-lg bg-role-alumni/10">
                      <Icon className="h-5 w-5 text-role-alumni" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-card-foreground">{action.title}</p>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                </PermissionWrapper>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Alumni Spotlight */}
      <PermissionWrapper permission="alumni_events">
        <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">Upcoming Alumni Events</CardTitle>
            <CardDescription>Stay connected with your alma mater</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  name: 'Annual Alumni Meet 2024',
                  date: 'December 15, 2024',
                  location: 'Main Campus',
                  attendees: '200+ expected'
                },
                {
                  name: 'Tech Talk Series',
                  date: 'January 20, 2025',
                  location: 'Virtual Event',
                  attendees: '150+ registered'
                },
                {
                  name: 'Scholarship Fundraiser',
                  date: 'February 10, 2025',
                  location: 'Bangalore',
                  attendees: '50+ confirmed'
                }
              ].map((event, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-white/10 rounded-lg bg-white/5 hover:border-role-alumni/20 transition-colors duration-300">
                  <div>
                    <h4 className="font-medium text-card-foreground">{event.name}</h4>
                    <p className="text-sm text-muted-foreground">{event.date} • {event.location}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="bg-role-alumni/10 text-role-alumni border-role-alumni/20">{event.attendees}</Badge>
                    <div className="mt-2">
                      <Button size="sm" variant="outline" className="border-role-alumni/30 hover:bg-role-alumni/10">
                        Register
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </PermissionWrapper>

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
