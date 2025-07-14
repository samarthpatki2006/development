import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Award, 
  Star, 
  Trophy,
  BookOpen,
  Users,
  TrendingUp,
  Plus,
  Eye,
  Calendar,
  Target,
  Gift
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import PermissionWrapper from '@/components/PermissionWrapper';

interface TeacherRecognitionProps {
  teacherData: any;
}

const TeacherRecognition = ({ teacherData }: TeacherRecognitionProps) => {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [professionalDev, setProfessionalDev] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newApplication, setNewApplication] = useState({
    type: 'award',
    title: '',
    description: '',
    category: '',
    supporting_documents: '',
    deadline: ''
  });

  useEffect(() => {
    fetchRecognitionData();
  }, [teacherData]);

  const fetchRecognitionData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchFeedback(),
        fetchAchievements(),
        fetchProfessionalDevelopment(),
        fetchApplications()
      ]);
    } catch (error) {
      console.error('Error fetching recognition data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedback = async () => {
    // Simulate feedback data
    setFeedback([
      {
        id: '1',
        type: 'student_feedback',
        source: 'End of Semester Survey',
        course: 'Data Structures & Algorithms',
        rating: 4.7,
        feedback_text: 'Excellent teaching method and very clear explanations. Made complex topics easy to understand.',
        date: '2024-01-20',
        semester: 'Fall 2023'
      },
      {
        id: '2',
        type: 'peer_review',
        source: 'Department Head Review',
        reviewer: 'Dr. Sarah Johnson',
        rating: 4.5,
        feedback_text: 'Demonstrates excellent classroom management and innovative teaching techniques.',
        date: '2024-01-15',
        category: 'Teaching Excellence'
      },
      {
        id: '3',
        type: 'student_feedback',
        source: 'Mid-Semester Feedback',
        course: 'Database Management Systems',
        rating: 4.8,
        feedback_text: 'Very engaging lectures and practical examples. Assignments are challenging but fair.',
        date: '2024-01-25',
        semester: 'Spring 2024'
      }
    ]);
  };

  const fetchAchievements = async () => {
    // Simulate achievements data
    setAchievements([
      {
        id: '1',
        title: 'Excellence in Teaching Award',
        category: 'Teaching',
        level: 'Department',
        awarded_date: '2023-12-15',
        description: 'Recognized for outstanding teaching performance and student engagement',
        issuer: 'Computer Science Department'
      },
      {
        id: '2',
        title: 'Best Research Paper Award',
        category: 'Research',
        level: 'Conference',
        awarded_date: '2023-11-20',
        description: 'Paper on "Machine Learning Applications in Education" received best paper award',
        issuer: 'International Conference on Educational Technology'
      },
      {
        id: '3',
        title: 'Student Choice Award',
        category: 'Teaching',
        level: 'College',
        awarded_date: '2023-10-10',
        description: 'Voted by students as the most inspiring teacher of the year',
        issuer: 'Student Union'
      }
    ]);
  };

  const fetchProfessionalDevelopment = async () => {
    // Simulate professional development data
    setProfessionalDev([
      {
        id: '1',
        activity: 'Advanced Teaching Methods Workshop',
        type: 'Workshop',
        provider: 'Educational Excellence Institute',
        completed_date: '2024-01-10',
        credits: 20,
        certificate_url: '#',
        status: 'completed'
      },
      {
        id: '2',
        activity: 'Research Methodology Certification',
        type: 'Certification',
        provider: 'Academic Research Council',
        completed_date: '2023-12-05',
        credits: 40,
        certificate_url: '#',
        status: 'completed'
      },
      {
        id: '3',
        activity: 'Digital Learning Technologies',
        type: 'Course',
        provider: 'Technology in Education Institute',
        start_date: '2024-02-01',
        credits: 30,
        status: 'in_progress',
        progress: 60
      }
    ]);
  };

  const fetchApplications = async () => {
    // Simulate applications data
    setApplications([
      {
        id: '1',
        type: 'award',
        title: 'Innovation in Teaching Award 2024',
        category: 'Teaching Excellence',
        submitted_date: '2024-01-30',
        deadline: '2024-03-15',
        status: 'submitted',
        description: 'Application for innovative use of technology in classroom teaching'
      },
      {
        id: '2',
        type: 'funding',
        title: 'Educational Research Grant',
        category: 'Research Funding',
        submitted_date: '2024-01-25',
        deadline: '2024-04-01',
        status: 'under_review',
        amount: '$15,000',
        description: 'Funding for research on adaptive learning systems'
      }
    ]);
  };

  const submitApplication = async () => {
    try {
      const applicationData = {
        ...newApplication,
        submitted_by: teacherData.user_id,
        submitted_date: new Date().toISOString(),
        status: 'submitted'
      };

      setApplications(prev => [...prev, { ...applicationData, id: Date.now().toString() }]);

      toast({
        title: 'Success',
        description: 'Application submitted successfully'
      });

      setNewApplication({
        type: 'award',
        title: '',
        description: '',
        category: '',
        supporting_documents: '',
        deadline: ''
      });

    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit application',
        variant: 'destructive'
      });
    }
  };

  const getAverageRating = () => {
    const ratings = feedback.filter(f => f.rating).map(f => f.rating);
    return ratings.length > 0 ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1) : 'N/A';
  };

  const getTotalCredits = () => {
    return professionalDev.reduce((total, dev) => total + (dev.credits || 0), 0);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <PermissionWrapper permission="review_assignments">
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{getAverageRating()}</p>
              <p className="text-sm text-muted-foreground">Average Rating</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{achievements.length}</p>
              <p className="text-sm text-muted-foreground">Awards & Recognition</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{getTotalCredits()}</p>
              <p className="text-sm text-muted-foreground">Development Credits</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{applications.length}</p>
              <p className="text-sm text-muted-foreground">Active Applications</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="feedback" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="feedback">Feedback & Reviews</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="development">Professional Development</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
          </TabsList>

          {/* Feedback & Reviews */}
          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Feedback & Performance Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feedback.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={item.type === 'student_feedback' ? 'default' : 'secondary'}>
                              {item.type === 'student_feedback' ? 'Student Feedback' : 'Peer Review'}
                            </Badge>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={`h-4 w-4 ${star <= item.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                />
                              ))}
                              <span className="text-sm font-medium ml-1">{item.rating}</span>
                            </div>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Source:</span> {item.source}</p>
                            {item.course && <p><span className="font-medium">Course:</span> {item.course}</p>}
                            {item.reviewer && <p><span className="font-medium">Reviewer:</span> {item.reviewer}</p>}
                            <p className="text-muted-foreground italic">"{item.feedback_text}"</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(item.date).toLocaleDateString()}
                              {item.semester && ` • ${item.semester}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements */}
          <TabsContent value="achievements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Awards & Recognition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {achievements.map((achievement) => (
                    <Card key={achievement.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-yellow-100 rounded-full">
                            <Trophy className="h-6 w-6 text-yellow-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{achievement.title}</h3>
                              <Badge variant="outline">{achievement.level}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                            <div className="text-xs text-muted-foreground">
                              <p><span className="font-medium">Issued by:</span> {achievement.issuer}</p>
                              <p><span className="font-medium">Date:</span> {new Date(achievement.awarded_date).toLocaleDateString()}</p>
                              <p><span className="font-medium">Category:</span> {achievement.category}</p>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View Certificate
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Professional Development */}
          <TabsContent value="development" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Professional Development Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {professionalDev.map((dev) => (
                    <Card key={dev.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{dev.activity}</h3>
                            <Badge variant={dev.status === 'completed' ? 'default' : 'secondary'}>
                              {dev.status === 'completed' ? 'Completed' : 'In Progress'}
                            </Badge>
                            <Badge variant="outline">{dev.credits} Credits</Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p><span className="font-medium">Provider:</span> {dev.provider}</p>
                            <p><span className="font-medium">Type:</span> {dev.type}</p>
                            {dev.completed_date && (
                              <p><span className="font-medium">Completed:</span> {new Date(dev.completed_date).toLocaleDateString()}</p>
                            )}
                            {dev.start_date && dev.status === 'in_progress' && (
                              <p><span className="font-medium">Started:</span> {new Date(dev.start_date).toLocaleDateString()}</p>
                            )}
                          </div>
                          {dev.status === 'in_progress' && dev.progress && (
                            <div className="mt-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Progress</span>
                                <span>{dev.progress}%</span>
                              </div>
                              <Progress value={dev.progress} className="h-2" />
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {dev.certificate_url && (
                            <Button size="sm" variant="outline">
                              <Gift className="h-4 w-4 mr-1" />
                              Certificate
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Applications */}
          <TabsContent value="applications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Award & Funding Applications
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Application
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Submit New Application</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <select
                          className="w-full p-2 border rounded"
                          value={newApplication.type}
                          onChange={(e) => setNewApplication({...newApplication, type: e.target.value})}
                        >
                          <option value="award">Award Application</option>
                          <option value="funding">Research Funding</option>
                          <option value="grant">Educational Grant</option>
                        </select>
                        
                        <Input
                          placeholder="Application title"
                          value={newApplication.title}
                          onChange={(e) => setNewApplication({...newApplication, title: e.target.value})}
                        />
                        
                        <Input
                          placeholder="Category"
                          value={newApplication.category}
                          onChange={(e) => setNewApplication({...newApplication, category: e.target.value})}
                        />
                        
                        <Textarea
                          placeholder="Description and justification"
                          value={newApplication.description}
                          onChange={(e) => setNewApplication({...newApplication, description: e.target.value})}
                          rows={4}
                        />
                        
                        <Input
                          type="date"
                          placeholder="Application deadline"
                          value={newApplication.deadline}
                          onChange={(e) => setNewApplication({...newApplication, deadline: e.target.value})}
                        />
                        
                        <Textarea
                          placeholder="Supporting documents (list URLs or descriptions)"
                          value={newApplication.supporting_documents}
                          onChange={(e) => setNewApplication({...newApplication, supporting_documents: e.target.value})}
                        />
                        
                        <Button onClick={submitApplication} className="w-full">
                          Submit Application
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.map((app) => (
                    <Card key={app.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{app.title}</h3>
                            <Badge variant={
                              app.status === 'submitted' ? 'secondary' :
                              app.status === 'under_review' ? 'default' :
                              app.status === 'approved' ? 'default' :
                              'destructive'
                            }>
                              {app.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline">{app.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{app.description}</p>
                          <div className="text-xs text-muted-foreground">
                            <p><span className="font-medium">Submitted:</span> {new Date(app.submitted_date).toLocaleDateString()}</p>
                            <p><span className="font-medium">Deadline:</span> {new Date(app.deadline).toLocaleDateString()}</p>
                            {app.amount && <p><span className="font-medium">Amount:</span> {app.amount}</p>}
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PermissionWrapper>
  );
};

export default TeacherRecognition;