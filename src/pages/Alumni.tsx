
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import AlumniDashboard from '@/components/alumni/AlumniDashboard';
import AlumniEvents from '@/components/alumni/AlumniEvents';
import AlumniNetworking from '@/components/alumni/AlumniNetworking';
import AlumniContributions from '@/components/alumni/AlumniContributions';
import AlumniDocuments from '@/components/alumni/AlumniDocuments';
import AlumniSupport from '@/components/alumni/AlumniSupport';
import { Home, Calendar, Users, Heart, FileText, HelpCircle } from 'lucide-react';

// Tab configuration for better maintainability
const ALUMNI_TABS = [
  { value: 'dashboard', label: 'Dashboard', icon: Home },
  { value: 'events', label: 'Events', icon: Calendar },
  { value: 'networking', label: 'Networking', icon: Users },
  { value: 'contributions', label: 'Contributions', icon: Heart },
  { value: 'documents', label: 'Documents', icon: FileText },
  { value: 'support', label: 'Support', icon: HelpCircle },
];

const Alumni = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const userData = localStorage.getItem('colcord_user');
        if (!userData) {
          navigate('/');
          return;
        }

        const parsedUser = JSON.parse(userData);
        if (parsedUser.user_type !== 'alumni') {
          toast({
            title: 'Access Denied',
            description: 'This area is for alumni only.',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        setUser(parsedUser);
      } catch (error) {
        console.error('Error checking user:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('colcord_user');
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-role-alumni" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-card-foreground">
                ColCord - Alumni Portal
              </h1>
              <span className="text-sm text-muted-foreground">
                Welcome back, {user.first_name} {user.last_name}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-6 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-card/50 backdrop-blur-sm border border-white/10">
            {ALUMNI_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center space-x-2 data-[state=active]:bg-role-alumni/20 data-[state=active]:text-role-alumni data-[state=active]:border-role-alumni/30"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="min-h-[600px]">
            <TabsContent value="dashboard" className="space-y-6 animate-fade-in">
              <AlumniDashboard user={user} />
            </TabsContent>

            <TabsContent value="events" className="space-y-6 animate-fade-in">
              <AlumniEvents user={user} />
            </TabsContent>

            <TabsContent value="networking" className="space-y-6 animate-fade-in">
              <AlumniNetworking user={user} />
            </TabsContent>

            <TabsContent value="contributions" className="space-y-6 animate-fade-in">
              <AlumniContributions user={user} />
            </TabsContent>

            <TabsContent value="documents" className="space-y-6 animate-fade-in">
              <AlumniDocuments user={user} />
            </TabsContent>

            <TabsContent value="support" className="space-y-6 animate-fade-in">
              <AlumniSupport user={user} />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default Alumni;
