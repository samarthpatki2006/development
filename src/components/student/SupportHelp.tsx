
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  HelpCircle, 
  Ticket, 
  Phone, 
  Mail, 
  MessageSquare,
  Plus,
  Search,
  BookOpen,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SupportHelpProps {
  studentData: any;
}

const SupportHelp: React.FC<SupportHelpProps> = ({ studentData }) => {
  const [supportTickets, setSupportTickets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Sample FAQs (in a real app, these would come from the database)
  const faqs = [
    {
      id: 1,
      category: 'Academic',
      question: 'How do I access my course materials?',
      answer: 'You can access your course materials by going to the "My Courses" section, selecting your course, and clicking on the "Materials" tab. All lecture notes, videos, and resources will be available for download.'
    },
    {
      id: 2,
      category: 'Academic',
      question: 'How do I submit assignments?',
      answer: 'To submit assignments, navigate to "My Courses", select the relevant course, go to the "Assignments" tab, find your assignment, and click "Submit Assignment". You can type your answer or upload files as required.'
    },
    {
      id: 3,
      category: 'Technical',
      question: 'I forgot my password. How do I reset it?',
      answer: 'Click on the "Forgot Password" link on the login page. Enter your user code and follow the instructions sent to your registered email address.'
    },
    {
      id: 4,
      category: 'Technical',
      question: 'The website is not loading properly. What should I do?',
      answer: 'Try clearing your browser cache and cookies, or try accessing the site from a different browser. If the problem persists, submit a technical support ticket.'
    },
    {
      id: 5,
      category: 'Financial',
      question: 'How do I make fee payments online?',
      answer: 'Go to the "Payments & Fees" section, select the pending fee you want to pay, choose your payment method, and follow the secure payment process.'
    },
    {
      id: 6,
      category: 'Financial',
      question: 'Where can I download my payment receipts?',
      answer: 'All payment receipts are available in the "Payments & Fees" section under "Payment History". Click the "Receipt" button next to any completed payment.'
    },
    {
      id: 7,
      category: 'Hostel',
      question: 'How do I apply for hostel accommodation?',
      answer: 'Visit the "Hostel & Facility" section, review available rooms, and click "Apply for Hostel". Fill out the application form with your preferences and submit.'
    },
    {
      id: 8,
      category: 'Hostel',
      question: 'Can I change my room after allocation?',
      answer: 'Room changes are subject to availability and approval. Submit a facility request with your reason for the room change, and the hostel administration will review it.'
    },
    {
      id: 9,
      category: 'General',
      question: 'How do I update my personal information?',
      answer: 'Currently, personal information updates need to be requested through the administration. Please submit a support ticket with the details you need to update.'
    },
    {
      id: 10,
      category: 'General',
      question: 'Who do I contact for medical emergencies?',
      answer: 'For medical emergencies, immediately contact the campus medical center at extension 911 or call the emergency number provided in your student handbook.'
    }
  ];

  const contactInfo = {
    academic: {
      title: 'Academic Support',
      email: 'team@colcord.co.in',
      phone: '+91 93110 13848',
      hours: 'Mon-Fri: 9:00 AM - 5:00 PM'
    },
    technical: {
      title: 'Technical Support',
      email: 'team@colcord.co.in',
      phone: '+91 93110 13848',
      hours: '24/7 Online Support'
    },
    financial: {
      title: 'Financial Services',
      email: 'team@colcord.co.in',
      phone: '+91 93110 13848',
      hours: 'Mon-Fri: 8:00 AM - 6:00 PM'
    },
    hostel: {
      title: 'Hostel Administration',
      email: 'team@colcord.co.in',
      phone: '+91 93110 13848',
      hours: 'Mon-Sun: 6:00 AM - 10:00 PM'
    },
    general: {
      title: 'General Support',
      email: 'team@colcord.co.in',
      phone: '+91 93110 13848',
      hours: 'Mon-Fri: 9:00 AM - 5:00 PM'
    }
  };

  useEffect(() => {
    fetchSupportTickets();
  }, [studentData]);

  const fetchSupportTickets = async () => {
    try {
      const { data: ticketsData } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('student_id', studentData.user_id)
        .order('created_at', { ascending: false });

      setSupportTickets(ticketsData || []);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch support tickets',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createSupportTicket = async (category: string, title: string, description: string, priority: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          student_id: studentData.user_id,
          college_id: studentData.college_id,
          title: title,
          description: description,
          category: category,
          priority: priority,
          status: 'open'
        });

      if (error) throw error;

      toast({
        title: 'Ticket Created',
        description: 'Your support ticket has been submitted successfully',
      });

      fetchSupportTickets();
    } catch (error) {
      console.error('Error creating support ticket:', error);
      toast({
        title: 'Error',
        description: 'Failed to create support ticket',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'destructive';
      case 'in_progress':
        return 'default';
      case 'resolved':
        return 'default';
      case 'closed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedFaqs = filteredFaqs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, typeof faqs>);

  if (loading) {
    return <div className="flex justify-center py-8">Loading support information...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Support & Help</h2>
        <div className="flex space-x-2">
          <Badge variant="outline">{supportTickets.length} My Tickets</Badge>
          <Badge variant="outline">{faqs.length} FAQs</Badge>
        </div>
      </div>

      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tickets" className="flex items-center space-x-2">
            <Ticket className="h-4 w-4" />
            <span>Support Tickets</span>
          </TabsTrigger>
          <TabsTrigger value="faqs" className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>FAQs</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center space-x-2">
            <Phone className="h-4 w-4" />
            <span>Contact Info</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-6">
          {/* New Ticket Button */}
          <div className="flex justify-end">
            <SupportTicketDialog onCreate={createSupportTicket} />
          </div>

          {/* My Tickets */}
          <Card>
            <CardHeader>
              <CardTitle>My Support Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              {supportTickets.length === 0 ? (
                <div className="text-center py-8">
                  <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Support Tickets</h3>
                  <p className="text-gray-500 mb-4">You haven't submitted any support tickets yet.</p>
                  <SupportTicketDialog onCreate={createSupportTicket} />
                </div>
              ) : (
                <div className="space-y-4">
                  {supportTickets.map((ticket: any) => (
                    <Card key={ticket.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{ticket.title}</h4>
                            <p className="text-sm text-gray-600">
                              Ticket #{ticket.id.slice(-8)} • {ticket.category}
                            </p>
                            <p className="text-sm text-gray-500">
                              Created: {new Date(ticket.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-2 mb-2">
                              {getStatusIcon(ticket.status)}
                              <Badge variant={getStatusColor(ticket.status)}>
                                {ticket.status}
                              </Badge>
                            </div>
                            <Badge variant="outline" className="capitalize">
                              {ticket.priority} Priority
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3">{ticket.description}</p>
                        
                        {ticket.updated_at !== ticket.created_at && (
                          <div className="text-xs text-gray-500 border-t pt-2">
                            Last updated: {new Date(ticket.updated_at).toLocaleDateString()}
                          </div>
                        )}

                        {ticket.resolved_at && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <p className="text-sm font-medium text-green-800">
                              ✓ Resolved on {new Date(ticket.resolved_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faqs" className="space-y-6">
          {/* Search Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* FAQs by Category */}
          {Object.keys(groupedFaqs).length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No FAQs found matching your search.</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <HelpCircle className="h-5 w-5" />
                    <span>{category} FAQs</span>
                    <Badge variant="outline">{categoryFaqs.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible>
                    {categoryFaqs.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id.toString()}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(contactInfo).map(([key, info]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {key === 'technical' ? <MessageSquare className="h-5 w-5" /> :
                     key === 'financial' ? <HelpCircle className="h-5 w-5" /> :
                     <Phone className="h-5 w-5" />}
                    <span>{info.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{info.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{info.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Hours</p>
                      <p className="font-medium">{info.hours}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Emergency Contacts */}
          <Card className="border-l-4 border-red-500">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span>Emergency Contacts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Campus Emergency</h4>
                  <p className="text-lg font-bold text-red-600">911</p>
                  <p className="text-sm text-gray-600">For immediate emergencies on campus</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Campus Security</h4>
                  <p className="text-lg font-bold">+91 93110 13848</p>
                  <p className="text-sm text-gray-600">24/7 Campus Security Hotline</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Medical Center</h4>
                  <p className="text-lg font-bold">+91 93110 13848</p>
                  <p className="text-sm text-gray-600">On-campus medical assistance</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Counseling Services</h4>
                  <p className="text-lg font-bold">+91 93110 13848</p>
                  <p className="text-sm text-gray-600">Mental health and counseling support</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Support Ticket Dialog Component
const SupportTicketDialog: React.FC<{
  onCreate: (category: string, title: string, description: string, priority: string) => void;
}> = ({ onCreate }) => {
  const [category, setCategory] = useState('general');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return;

    onCreate(category, title, description, priority);
    setCategory('general');
    setTitle('');
    setDescription('');
    setPriority('normal');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Support Ticket
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Support Ticket</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="hostel">Hostel</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="Brief summary of the issue..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Detailed description of the issue and any steps you've already taken..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Priority</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> For faster resolution, please provide as much detail as possible 
              including screenshots, error messages, or steps to reproduce the issue.
            </p>
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={!title.trim() || !description.trim()}
            className="w-full"
          >
            Submit Ticket
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupportHelp;
