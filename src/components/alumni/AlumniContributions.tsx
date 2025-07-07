import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";
import { Heart, DollarSign, Users, Award, TrendingUp, Gift } from 'lucide-react';

interface AlumniContributionsProps {
  user: any;
}

const AlumniContributions = ({ user }: AlumniContributionsProps) => {
  const [contributions, setContributions] = useState<any[]>([]);
  const [volunteerOpportunities, setVolunteerOpportunities] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [donationAmount, setDonationAmount] = useState('');
  const [donationDescription, setDonationDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [volunteerMotivation, setVolunteerMotivation] = useState('');
  const [volunteerAvailability, setVolunteerAvailability] = useState('');

  useEffect(() => {
    fetchContributions();
    fetchVolunteerOpportunities();
    fetchMyApplications();
  }, [user]);

  const fetchContributions = async () => {
    try {
      const { data, error } = await supabase
        .from('alumni_contributions')
        .select('*')
        .eq('alumnus_id', user.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContributions(data || []);
    } catch (error) {
      console.error('Error fetching contributions:', error);
    }
  };

  const fetchVolunteerOpportunities = async () => {
    try {
      const { data, error } = await supabase
        .from('volunteer_opportunities')
        .select('*')
        .eq('college_id', user.college_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVolunteerOpportunities(data || []);
    } catch (error) {
      console.error('Error fetching volunteer opportunities:', error);
    }
  };

  const fetchMyApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('volunteer_applications')
        .select(`
          *,
          volunteer_opportunities(title, description)
        `)
        .eq('volunteer_id', user.user_id);

      if (error) throw error;
      setMyApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDonation = async () => {
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid donation amount',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('alumni_contributions')
        .insert({
          alumnus_id: user.user_id,
          college_id: user.college_id,
          contribution_type: 'donation',
          amount: parseFloat(donationAmount),
          description: donationDescription || 'General donation',
          is_anonymous: isAnonymous,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: 'Donation Submitted',
        description: 'Your donation has been submitted for processing.',
      });

      setDonationAmount('');
      setDonationDescription('');
      setIsAnonymous(false);
      fetchContributions();
    } catch (error: any) {
      console.error('Error submitting donation:', error);
      toast({
        title: 'Donation Failed',
        description: error.message || 'Failed to submit donation',
        variant: 'destructive',
      });
    }
  };

  const handleVolunteerApplication = async (opportunityId: string) => {
    if (!volunteerMotivation.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide your motivation for volunteering',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('volunteer_applications')
        .insert({
          opportunity_id: opportunityId,
          volunteer_id: user.user_id,
          motivation: volunteerMotivation,
          availability: volunteerAvailability,
          status: 'applied'
        });

      if (error) throw error;

      toast({
        title: 'Application Submitted',
        description: 'Your volunteer application has been submitted.',
      });

      setVolunteerMotivation('');
      setVolunteerAvailability('');
      fetchMyApplications();
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Application Failed',
        description: error.message || 'Failed to submit application',
        variant: 'destructive',
      });
    }
  };

  const isApplied = (opportunityId: string) => {
    return myApplications.some(app => app.opportunity_id === opportunityId);
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
      <Tabs defaultValue="donate" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="donate">Donations</TabsTrigger>
          <TabsTrigger value="volunteer">Volunteer</TabsTrigger>
          <TabsTrigger value="history">My Contributions</TabsTrigger>
        </TabsList>

        <TabsContent value="donate">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donation Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5" />
                  <span>Make a Donation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Donation Amount ($)</label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    min="1"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Purpose (Optional)</label>
                  <Textarea
                    placeholder="Describe the purpose of your donation..."
                    value={donationDescription}
                    onChange={(e) => setDonationDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="anonymous"
                    checked={isAnonymous}
                    onCheckedChange={(checked) => setIsAnonymous(checked === true)}
                  />
                  <label htmlFor="anonymous" className="text-sm">
                    Make this donation anonymous
                  </label>
                </div>

                <Button onClick={handleDonation} className="w-full">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Donate Now
                </Button>
              </CardContent>
            </Card>

            {/* Quick Donation Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gift className="h-5 w-5" />
                  <span>Quick Donation Options</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[25, 50, 100, 250, 500, 1000].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      onClick={() => setDonationAmount(amount.toString())}
                      className="h-12"
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Impact of Your Donation</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• $25 - Provides textbooks for one student</li>
                    <li>• $100 - Supports laboratory equipment</li>
                    <li>• $500 - Funds a scholarship for one semester</li>
                    <li>• $1000 - Supports campus infrastructure</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="volunteer">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Volunteer Opportunities</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {volunteerOpportunities.length > 0 ? (
                  volunteerOpportunities.map((opportunity) => (
                    <Card key={opportunity.id} className="border-l-4 border-l-orange-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-2">{opportunity.title}</h3>
                            <p className="text-gray-600 mb-3">{opportunity.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500 mb-3">
                              {opportunity.time_commitment && (
                                <div>
                                  <strong>Time:</strong> {opportunity.time_commitment}
                                </div>
                              )}
                              {opportunity.location && (
                                <div>
                                  <strong>Location:</strong> {opportunity.location}
                                </div>
                              )}
                              {opportunity.max_volunteers && (
                                <div>
                                  <strong>Spots:</strong> {opportunity.current_volunteers || 0}/{opportunity.max_volunteers}
                                </div>
                              )}
                            </div>

                            {opportunity.requirements && (
                              <div className="mb-3">
                                <strong className="text-sm">Requirements:</strong>
                                <p className="text-sm text-gray-600">{opportunity.requirements}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="ml-4">
                            {isApplied(opportunity.id) ? (
                              <Badge variant="default">Applied</Badge>
                            ) : (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button>Apply</Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Apply for {opportunity.title}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <Textarea
                                      placeholder="Why do you want to volunteer for this opportunity?"
                                      value={volunteerMotivation}
                                      onChange={(e) => setVolunteerMotivation(e.target.value)}
                                      rows={4}
                                    />
                                    <Textarea
                                      placeholder="Describe your availability..."
                                      value={volunteerAvailability}
                                      onChange={(e) => setVolunteerAvailability(e.target.value)}
                                      rows={3}
                                    />
                                    <Button
                                      onClick={() => handleVolunteerApplication(opportunity.id)}
                                      className="w-full"
                                    >
                                      Submit Application
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No volunteer opportunities</h3>
                    <p className="text-gray-500">Check back later for new opportunities.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* My Donations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>My Donations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contributions.filter(c => c.contribution_type === 'donation').length > 0 ? (
                    contributions
                      .filter(c => c.contribution_type === 'donation')
                      .map((donation) => (
                        <div key={donation.id} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">${donation.amount?.toLocaleString()}</p>
                            <p className="text-sm text-gray-600">{donation.description}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(donation.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={donation.status === 'completed' ? 'default' : 'secondary'}>
                            {donation.status}
                          </Badge>
                        </div>
                      ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No donations yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* My Volunteer Applications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span>My Volunteer Applications</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {myApplications.length > 0 ? (
                    myApplications.map((application) => (
                      <div key={application.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{application.volunteer_opportunities?.title}</h4>
                          <Badge variant={
                            application.status === 'approved' ? 'default' :
                            application.status === 'rejected' ? 'destructive' : 'secondary'
                          }>
                            {application.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{application.motivation}</p>
                        <p className="text-xs text-gray-500">
                          Applied on {new Date(application.applied_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No applications yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlumniContributions;