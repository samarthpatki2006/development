
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
      color: 'text-blue-600',
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
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GraduationCap className="h-5 w-5" />
            <span>Welcome back, {user.first_name} {user.last_name}!</span>
          </CardTitle>
          <CardDescription>
            Alumni ID: {user.user_code} | Class of 2019 | Computer Science
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {alumniStats.map((stat, index) => {
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
            <CardDescription>Your latest alumni activities</CardDescription>
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
            <CardDescription>Connect and contribute to your alma mater</CardDescription>
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

      {/* Alumni Spotlight */}
      <PermissionWrapper permission="alumni_events">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Alumni Events</CardTitle>
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
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{event.name}</h4>
                    <p className="text-sm text-gray-600">{event.date} • {event.location}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">{event.attendees}</Badge>
                    <div className="mt-2">
                      <Button size="sm" variant="outline">
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
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <Heart className="h-5 w-5" />
              <span>Your Impact</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700 mb-4">
              Your contributions have helped 5 students with scholarships this year. Thank you for giving back!
            </p>
            <Button className="bg-green-600 hover:bg-green-700">
              Make Another Contribution
            </Button>
          </CardContent>
        </Card>
      </PermissionWrapper>
    </div>
  );
};

export default AlumniDashboard;
