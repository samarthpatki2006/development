
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";
import { Calendar, Users, Heart, Newspaper, TrendingUp, Award } from 'lucide-react';

interface AlumniDashboardProps {
  user: any;
}

const AlumniDashboard = ({ user }: AlumniDashboardProps) => {
  const [news, setNews] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [contributions, setContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch alumni news
      const { data: newsData, error: newsError } = await supabase
        .from('alumni_news')
        .select('*')
        .eq('college_id', user.college_id)
        .eq('is_active', true)
        .order('published_at', { ascending: false })
        .limit(5);

      if (newsError) throw newsError;
      setNews(newsData || []);

      // Fetch upcoming events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('college_id', user.college_id)
        .eq('is_active', true)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(5);

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

      // Fetch alumni stats
      const { data: statsData, error: statsError } = await supabase.rpc('get_alumni_stats', {
        college_uuid: user.college_id
      });

      if (statsError) throw statsError;
      setStats(statsData?.[0] || {});

      // Fetch user's contributions
      const { data: contributionsData, error: contributionsError } = await supabase
        .from('alumni_contributions')
        .select('*')
        .eq('alumnus_id', user.user_id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (contributionsError) throw contributionsError;
      setContributions(contributionsData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-2">Welcome back to your alma mater!</h2>
          <p className="text-blue-100">Stay connected with your college community and make a difference.</p>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alumni</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_alumni || 0}</div>
            <p className="text-xs text-muted-foreground">
              Connected graduates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contributors</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_contributors || 0}</div>
            <p className="text-xs text-muted-foreground">
              Making a difference
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.total_donations?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Community support
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.upcoming_events || 0}</div>
            <p className="text-xs text-muted-foreground">
              Events to attend
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campus News */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Newspaper className="h-5 w-5" />
              <span>Campus News & Updates</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {news.length > 0 ? (
              news.map((article) => (
                <div key={article.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium line-clamp-2">{article.title}</h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{article.excerpt}</p>
                    </div>
                    {article.is_featured && (
                      <Badge variant="default" className="ml-2">Featured</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(article.published_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No news available</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Upcoming Events</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {events.length > 0 ? (
              events.map((event) => (
                <div key={event.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{event.event_name}</h4>
                      <p className="text-sm text-gray-600">{event.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{new Date(event.start_date).toLocaleDateString()}</span>
                        {event.location && <span>{event.location}</span>}
                      </div>
                    </div>
                    <Badge variant="outline">{event.event_type}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No upcoming events</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Contributions */}
      {contributions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>My Recent Contributions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {contributions.map((contribution) => (
                <div key={contribution.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium capitalize">{contribution.contribution_type}</h4>
                    <p className="text-sm text-gray-600">{contribution.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(contribution.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {contribution.amount && (
                      <p className="font-bold">${contribution.amount.toLocaleString()}</p>
                    )}
                    <Badge 
                      variant={contribution.status === 'completed' ? 'default' : 'secondary'}
                    >
                      {contribution.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AlumniDashboard;
